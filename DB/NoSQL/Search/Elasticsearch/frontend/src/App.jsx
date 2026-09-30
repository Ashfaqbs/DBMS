import { useEffect, useState } from "react";

// Local hybrid dev runs the backend on :8002 (see README); the Docker-only
// path builds the backend image exposing :8000 instead. VITE_API_BASE lets
// the build pick the right one without editing this file.
const API_BASE =
  import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8002`;
const FIELD_TYPES = ["text", "keyword", "integer", "float", "boolean", "date"];

async function api(path, options) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function ClusterBar({ cluster }) {
  if (!cluster) return <div className="cluster-bar">Loading cluster info...</div>;
  return (
    <div className="cluster-bar">
      <span className="term-map">
        <strong>DB Server</strong> = ES Cluster
      </span>
      <span>
        <b>{cluster.cluster_name}</b>
      </span>
      <span className={`status-dot status-${cluster.status}`}>{cluster.status}</span>
      <span>{cluster.number_of_nodes} node(s)</span>
      <span>v{cluster.elasticsearch_version}</span>
      <span className="cluster-note">{cluster.defaults?.note}</span>
    </div>
  );
}

function ComparisonPanel({ cluster, selectedIndex, mapping, docs }) {
  const parts = selectedIndex ? selectedIndex.split("__") : [];
  const [database, schema, table] = parts.length === 3 ? parts : [null, null, null];
  const sampleDoc = docs && docs.length > 0 ? docs[0] : null;

  const rows = [
    {
      level: "Server",
      pg: {
        term: "DB Server",
        concept: "Postgres server (postmaster process)",
        defaults: "port 5432, one process listens for all databases on that instance",
      },
      es: {
        term: "Cluster",
        live: cluster ? `"${cluster.cluster_name}"` : "Loading...",
        defaults: cluster
          ? `${cluster.number_of_nodes} node(s), status: ${cluster.status}, v${cluster.elasticsearch_version}`
          : "-",
      },
    },
    {
      level: "Database",
      pg: {
        term: "Database",
        concept: "CREATE DATABASE mydb;",
        defaults: 'default database is "postgres", encoding UTF8, isolated per-connection',
      },
      es: {
        term: "(no native concept)",
        live: database
          ? `simulated as "${database}" — 1st segment of index name`
          : "No table selected yet",
        defaults: "Elasticsearch has NO built-in database concept. We fake it via naming.",
      },
    },
    {
      level: "Schema",
      pg: {
        term: "Schema",
        concept: "CREATE SCHEMA public;",
        defaults: 'default schema is "public" if none specified',
      },
      es: {
        term: "(no native concept)",
        live: schema
          ? `simulated as "${schema}" — 2nd segment of index name`
          : "No table selected yet",
        defaults: "Elasticsearch has NO built-in schema concept either.",
      },
    },
    {
      level: "Table",
      pg: {
        term: "Table",
        concept: "CREATE TABLE products (...);",
        defaults: "storage = heap, no built-in sharding",
      },
      es: {
        term: "Index",
        live: selectedIndex ? `"${selectedIndex}"` : "No table selected yet",
        defaults: mapping
          ? `shards: ${mapping.settings.number_of_shards}, replicas: ${mapping.settings.number_of_replicas}`
          : "default: 1 shard, 1 replica",
      },
    },
    {
      level: "Structure",
      pg: {
        term: "Columns (information_schema.columns)",
        concept: "column list with types, e.g. id int, name varchar(255)",
        defaults: "column types: int, varchar, boolean, timestamp, ...",
      },
      es: {
        term: "Mapping (properties)",
        live: mapping
          ? mapping.columns.map((c) => `${c.name}:${c.type}`).join(", ")
          : "Select a table to see its mapping",
        defaults: mapping
          ? `dynamic mapping: ${mapping.defaults.dynamic_mapping}`
          : "default: dynamic mapping = true (auto-adds unmapped fields)",
      },
    },
    {
      level: "Row",
      pg: {
        term: "Row (tuple)",
        concept: "identified internally by ctid",
        defaults: "primary key usually a SERIAL/UUID column you define",
      },
      es: {
        term: "Document",
        live: sampleDoc
          ? `_id: "${sampleDoc._id}"`
          : "Select a table with rows to see a sample _id",
        defaults: "default _id: auto-generated UUID if not supplied on insert",
      },
    },
  ];

  return (
    <div className="compare-panel">
      <div className="compare-header">
        <div className="compare-col-title pg-title">PostgreSQL (RDBMS)</div>
        <div className="compare-col-title level-title">Level</div>
        <div className="compare-col-title es-title">Elasticsearch — term + live data</div>
      </div>
      {rows.map((r) => (
        <div className="compare-row" key={r.level}>
          <div className="compare-cell pg-cell">
            <div className="cell-term">{r.pg.term}</div>
            <div className="cell-concept">{r.pg.concept}</div>
            <div className="cell-defaults">default: {r.pg.defaults}</div>
          </div>
          <div className="compare-cell level-cell">{r.level}</div>
          <div className="compare-cell es-cell">
            <div className="cell-term">{r.es.term}</div>
            <div className="cell-concept">{r.es.live}</div>
            <div className="cell-defaults">default: {r.es.defaults}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesPanel() {
  return (
    <details className="notes-panel" open>
      <summary>Overview</summary>

      <h4>Elastic is a cluster, no schema layer</h4>
      <ul>
        <li>
          Elastic is like a cluster, i.e. a bunch of nodes (VMs) — minimum 1 VM.
        </li>
        <li>There is no concept of schema.</li>
        <li>
          Tables are called index here — "indices" is just the plural of "index" (one index =
          one table).
        </li>
        <li>
          Each row is a document, something like in MongoDB — thought it could take any type
          of data.
        </li>
      </ul>

      <h4>Correction: mapping is real, but only in one direction</h4>
      <ul>
        <li>
          There <b>is</b> a schema for the documents (rows), and it's called <b>mapping</b>.
        </li>
        <li>
          It cannot accept a change to an existing field's mapping — but it{" "}
          <b>can</b> accept new fields.
        </li>
        <li>Existing fields: cannot change the type. New fields: can add anytime.</li>
      </ul>
    </details>
  );
}

function RdbmsFeaturesPanel() {
  const rows = [
    {
      feature: "Joins",
      es: "No equivalent",
      note:
        "No JOIN across indices. Workarounds: denormalize data at write time (embed what you'll read together), or use nested/parent-child within one index (limited, slower). Real ES design: shape data for reads, don't join.",
    },
    {
      feature: "Functions / stored procedures",
      es: "Partial — runtime fields, scripted queries",
      note:
        "Runtime fields compute a value at query time (e.g. price * 1.08). script_score lets you inline Painless scripting logic. Aggregations cover most GROUP BY-style needs. No stored procs.",
    },
    {
      feature: "Triggers",
      es: "No equivalent",
      note:
        "Nothing fires inside ES on insert/update. \"React to a change\" logic lives in your app layer, Watcher/alerting (for conditions), or an external pipeline reacting to writes.",
    },
    {
      feature: "Views",
      es: "Partial — index aliases",
      note:
        'An alias (e.g. "orders_current") can point at a real index, letting you query a stable name while the underlying index rotates — closer to a synonym than a SQL view. No virtual table defined by a query.',
    },
    {
      feature: "Foreign keys / constraints",
      es: "No equivalent",
      note:
        "No referential integrity. Nothing stops you inserting an order with a customer_id that doesn't exist. Enforcement, if needed, lives entirely in application code.",
    },
    {
      feature: "Transactions",
      es: "Partial — single document only",
      note:
        "A single document write is atomic. Multi-document ACID transactions (\"update these 3 documents together or none\") are not a native concept.",
    },
  ];

  return (
    <details className="notes-panel">
      <summary>RDBMS features → Elasticsearch equivalent (joins, functions, triggers, views...)</summary>
      <p className="form-hint" style={{ marginTop: 8 }}>
        ES is a distributed search/analytics engine over independent, denormalized documents —
        not a relational database enforcing integrity. Most of these RDBMS features either don't
        exist here or have a weaker, different-shaped analogue.
      </p>
      <table className="mapping-table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th>RDBMS feature</th>
            <th>Elasticsearch</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.feature}>
              <td>{r.feature}</td>
              <td>{r.es}</td>
              <td style={{ fontSize: 13, color: "#d6d9dd" }}>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="form-hint" style={{ marginTop: 10, marginBottom: 0 }}>
        Common real-world pattern: Postgres/MySQL stays the source of truth (joins, triggers,
        constraints); a denormalized, search-optimized copy of the data is synced into
        Elasticsearch for the query patterns SQL is bad at — full-text, faceted search,
        log-scale aggregation.
      </p>
    </details>
  );
}

function Tree({ structure, selectedIndex, onSelectTable, onNewTableFor }) {
  const indices = Object.values(structure)
    .flatMap((schemas) => Object.values(schemas))
    .flat();

  return (
    <div className="tree">
      <div className="tree-label db-label">Indices ({indices.length})</div>
      <ul className="tree-tables">
        {indices.map((t) => (
          <li
            key={t.index}
            className={t.index === selectedIndex ? "table-item active" : "table-item"}
            onClick={() => onSelectTable(t.index)}
            title={t.index}
          >
            {t.index} <span className="doc-count">({t.doc_count} docs)</span>
          </li>
        ))}
      </ul>
      <div className="tree-new-db">
        <button className="mini-btn" onClick={() => onNewTableFor("", "")}>
          + new index
        </button>
      </div>
    </div>
  );
}

function CreateTableForm({ onCreated, onCancel }) {
  const [indexName, setIndexName] = useState("");
  const [fields, setFields] = useState([{ name: "", type: "text" }]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const updateField = (i, key, value) => {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const cleanFields = fields.filter((f) => f.name.trim());
      const parts = indexName.split("__");
      const [database, schema, table] =
        parts.length === 3 ? parts : ["misc", "misc", indexName];
      await api("/api/tables", {
        method: "POST",
        body: JSON.stringify({ database, schema, table, fields: cleanFields }),
      });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel-form" onSubmit={submit}>
      <h3>Create index</h3>
      <p className="form-hint">
        This is Elasticsearch's only real structural unit — CREATE TABLE has no equivalent
        "database"/"schema" step here, just an index name.
      </p>
      <div className="form-row">
        <label>
          index name
          <input
            value={indexName}
            onChange={(e) => setIndexName(e.target.value)}
            placeholder="e.g. products"
            required
          />
        </label>
      </div>

      <p className="form-hint">fields (name + type, like a CREATE TABLE column list)</p>
      {fields.map((f, i) => (
        <div className="form-row" key={i}>
          <input
            placeholder="column name"
            value={f.name}
            onChange={(e) => updateField(i, "name", e.target.value)}
          />
          <select value={f.type} onChange={(e) => updateField(i, "type", e.target.value)}>
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="mini-btn danger"
            onClick={() => setFields((prev) => prev.filter((_, idx) => idx !== i))}
          >
            remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="mini-btn"
        onClick={() => setFields((prev) => [...prev, { name: "", type: "text" }])}
      >
        + column
      </button>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create table"}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function MappingPanel({ mapping }) {
  if (!mapping) return null;
  return (
    <details className="mapping-panel" open>
      <summary>Schema (mapping) &amp; defaults</summary>
      <table className="mapping-table">
        <thead>
          <tr>
            <th>column</th>
            <th>type</th>
          </tr>
        </thead>
        <tbody>
          {mapping.columns.map((c) => (
            <tr key={c.name}>
              <td>{c.name}</td>
              <td>{c.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="defaults-list">
        <li>shards: {mapping.settings.number_of_shards}</li>
        <li>replicas: {mapping.settings.number_of_replicas}</li>
        <li>dynamic mapping default: {mapping.defaults.dynamic_mapping}</li>
        <li>_id default: {mapping.defaults._id}</li>
      </ul>
      <p className="form-hint" style={{ marginTop: 10, marginBottom: 0 }}>
        <strong>Indexing here is opt-out, not opt-in.</strong> In Postgres, a column has no index
        unless you <code>CREATE INDEX</code> on it. In Elasticsearch, every field above already
        got an index structure built automatically the moment a document was inserted -- an
        inverted index for <code>text</code>, a value map for <code>keyword</code>, a BKD-tree for
        numbers. There's no step to add. The real decision is the opposite: whether to turn
        indexing <em>off</em> for a field you'll only ever display and never search or filter on,
        via <code>"index": false</code> in the mapping (saves disk + write time, but that field
        becomes unsearchable).
      </p>
    </details>
  );
}

function RowForm({ columns, initialValues, onSubmit, onCancel, submitLabel }) {
  const [values, setValues] = useState(initialValues || {});

  const setField = (name, value) => setValues((prev) => ({ ...prev, [name]: value }));

  const coerce = (type, raw) => {
    if (raw === "" || raw === undefined) return undefined;
    if (type === "integer") return parseInt(raw, 10);
    if (type === "float") return parseFloat(raw);
    if (type === "boolean") return raw === "true" || raw === true;
    return raw;
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = {};
    columns.forEach((c) => {
      const coerced = coerce(c.type, values[c.name]);
      if (coerced !== undefined) payload[c.name] = coerced;
    });
    onSubmit(payload);
  };

  return (
    <form className="panel-form" onSubmit={submit}>
      {columns.map((c) => (
        <label className="row-field" key={c.name}>
          {c.name} <span className="field-type">({c.type})</span>
          <input
            value={values[c.name] ?? ""}
            onChange={(e) => setField(c.name, e.target.value)}
          />
        </label>
      ))}
      <div className="form-actions">
        <button type="submit">{submitLabel}</button>
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

const API_CHEATSHEET = [
  {
    group: "Index CRUD",
    entries: [
      { method: "PUT", path: "/myindex", body: '{"mappings":{"properties":{"name":{"type":"text"}}}}', desc: "Create an index (table) with a mapping." },
      { method: "GET", path: "/myindex", body: null, desc: "Read an index's settings + mapping." },
      { method: "PUT", path: "/myindex/_mapping", body: '{"properties":{"new_field":{"type":"keyword"}}}', desc: "Add a new field to an existing mapping." },
      { method: "DELETE", path: "/myindex", body: null, desc: "Drop the index." },
    ],
  },
  {
    group: "Document CRUD",
    entries: [
      { method: "POST", path: "/myindex/_doc", body: '{"name":"hello"}', desc: "Insert a document, auto-generated _id." },
      { method: "PUT", path: "/myindex/_doc/1", body: '{"name":"hello"}', desc: "Insert/replace a document with explicit _id." },
      { method: "GET", path: "/myindex/_doc/1", body: null, desc: "Read a document by _id." },
      { method: "POST", path: "/myindex/_update/1", body: '{"doc":{"name":"updated"}}', desc: "Partial update of a document." },
      { method: "DELETE", path: "/myindex/_doc/1", body: null, desc: "Delete a document by _id." },
    ],
  },
  {
    group: "Search",
    entries: [
      { method: "POST", path: "/myindex/_search", body: '{"query":{"match_all":{}}}', desc: "Match every document." },
      { method: "POST", path: "/myindex/_search", body: '{"query":{"multi_match":{"query":"brake","fields":["name"],"fuzziness":"AUTO"}}}', desc: "Fuzzy full-text search." },
    ],
  },
];

function ApiPlaygroundPage({ indices }) {
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("/_cat/indices?v");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const loadIntoConsole = (entry) => {
    setMethod(entry.method);
    setPath(entry.path);
    setBody(entry.body || "");
    setResponse(null);
    setError(null);
  };

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setResponse(null);
    try {
      let parsedBody = null;
      if (body.trim()) {
        try {
          parsedBody = JSON.parse(body);
        } catch {
          throw new Error("Request body is not valid JSON");
        }
      }
      const result = await api("/api/raw", {
        method: "POST",
        body: JSON.stringify({ method, path, body: parsedBody }),
      });
      setResponse(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="api-page">
      <h2>Elasticsearch's own REST API</h2>
      <p className="form-hint">
        Everything the UI on the Explorer page does, Elasticsearch itself exposes directly as a
        plain HTTP REST API — no wrapper required. Pick a cheatsheet entry to load it into the
        console below, or write your own request and hit Send. Requests are relayed through the
        backend's <code>/api/raw</code> passthrough (to avoid browser CORS), but they hit the
        real Elasticsearch endpoint exactly as shown.
      </p>

      {indices && indices.length > 0 && (
        <p className="form-hint">
          Your real index names, for substituting into <code>/myindex</code>:{" "}
          {indices.map((i) => (
            <code key={i} style={{ marginRight: 6 }}>
              {i}
            </code>
          ))}
        </p>
      )}

      <div className="api-layout">
        <div className="api-cheatsheet">
          {API_CHEATSHEET.map((group) => (
            <div key={group.group} className="api-group">
              <div className="api-group-title">{group.group}</div>
              {group.entries.map((entry, i) => (
                <button
                  key={i}
                  type="button"
                  className="api-entry"
                  onClick={() => loadIntoConsole(entry)}
                >
                  <span className={`api-method api-method-${entry.method}`}>{entry.method}</span>
                  <span className="api-path">{entry.path}</span>
                  <span className="api-desc">{entry.desc}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <form className="api-console panel-form" onSubmit={send}>
          <h3>Test console</h3>
          <div className="form-row">
            <label style={{ flex: "0 0 110px" }}>
              method
              <select value={method} onChange={(e) => setMethod(e.target.value)}>
                {["GET", "POST", "PUT", "DELETE"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label>
              path
              <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/myindex/_doc/1" />
            </label>
          </div>
          <label className="row-field" style={{ flexDirection: "column", alignItems: "stretch" }}>
            body (JSON, optional)
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"name": "hello"}'
              className="api-body-input"
            />
          </label>
          <div className="form-actions">
            <button type="submit" disabled={sending}>
              {sending ? "Sending..." : "Send"}
            </button>
          </div>

          {error && <p className="error">{error}</p>}
          {response && (
            <div className="api-response">
              <div className="api-response-status">HTTP {response.status_code}</div>
              <pre>{JSON.stringify(response.body, null, 2)}</pre>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function DocTable({ docs, columns, onEdit, onDelete }) {
  if (!docs || docs.length === 0) return <p className="empty">No documents (rows).</p>;
  const cols = columns.length ? columns.map((c) => c.name) : Object.keys(docs[0] || {});

  return (
    <table className="doc-table">
      <thead>
        <tr>
          <th>_id</th>
          {cols.map((c) => (
            <th key={c}>{c}</th>
          ))}
          <th>actions</th>
        </tr>
      </thead>
      <tbody>
        {docs.map((doc) => (
          <tr key={doc._id}>
            <td className="id-cell">{doc._id}</td>
            {cols.map((c) => (
              <td key={c}>{doc[c] === undefined ? "" : String(doc[c])}</td>
            ))}
            <td className="actions-cell">
              <button className="mini-btn" onClick={() => onEdit(doc)}>
                edit
              </button>
              <button className="mini-btn danger" onClick={() => onDelete(doc._id)}>
                delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function McpChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const history = messages.map(({ role, content }) => ({ role, content }));
      const result = await api("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, history }),
      });
      setMessages([
        ...nextMessages,
        { role: "assistant", content: result.reply, trace: result.trace },
      ]);
    } catch (err) {
      setError(err.message);
      setMessages(nextMessages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-page">
      <h2>MCP Chat — ask about error logs</h2>
      <p className="form-hint">
        This chat is an <strong>MCP client</strong>: your message goes to an LLM (Groq,{" "}
        <code>openai/gpt-oss-120b</code>) which can call tools exposed by a separate{" "}
        <strong>MCP server</strong> process (<code>backend/mcp_server.py</code>) over the MCP
        protocol via stdio. That server's tools query the{" "}
        <code>observability__logs__error_logs</code> index directly -- the LLM never talks to
        Elasticsearch itself, it only sees tool results. Try: "which team has the most errors?",
        "show me timeout errors", "what's the most common error type?".
      </p>

      <div className="mapping-panel" style={{ marginBottom: 16 }}>
        <div style={{ color: "#a7f3d0", fontWeight: 600, marginBottom: 8 }}>Request path</div>
        <p className="form-hint" style={{ marginTop: 0, marginBottom: 0 }}>
          You type in this box → <code>POST /api/chat</code> (FastAPI) → MCP client launches{" "}
          <code>mcp_server.py</code> as a subprocess → Groq LLM decides which tool(s) to call
          (<code>search_errors</code>, <code>get_error_by_id</code>,{" "}
          <code>count_errors_by_team</code>, <code>count_errors_by_name</code>) → MCP client
          executes the tool against Elasticsearch → result goes back to the LLM → LLM answers in
          plain text.
        </p>
      </div>

      <div className="chat-window">
        {messages.length === 0 && (
          <div className="form-hint">No messages yet -- ask something about the error logs.</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-msg-${m.role}`}>
            <div className="chat-msg-role">{m.role === "user" ? "You" : "Assistant"}</div>
            <div className="chat-msg-content">{m.content}</div>
            {m.trace && m.trace.length > 0 && (
              <details className="chat-trace">
                <summary>
                  {m.trace.length} tool call{m.trace.length > 1 ? "s" : ""} used
                </summary>
                {m.trace.map((t, j) => (
                  <div key={j} className="chat-trace-item">
                    <div>
                      <code>{t.tool}</code>({JSON.stringify(t.args)})
                    </div>
                    <pre>{t.result}</pre>
                  </div>
                ))}
              </details>
            )}
          </div>
        ))}
        {loading && <div className="form-hint">Thinking / calling tools...</div>}
      </div>

      {error && <p className="error-text">{error}</p>}

      <form onSubmit={send} className="search-form">
        <input
          type="text"
          placeholder="e.g. which team has the most errors?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
}

function DistributedPage({ indices }) {
  const [selected, setSelected] = useState(indices[0] || "");
  const [shardInfo, setShardInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (indices.length > 0 && !indices.includes(selected)) {
      setSelected(indices[0]);
    }
  }, [indices]);

  useEffect(() => {
    if (!selected) return;
    setError(null);
    api(`/api/tables/${selected}/shards`)
      .then(setShardInfo)
      .catch((e) => setError(e.message));
  }, [selected]);

  const byShardNumber = {};
  if (shardInfo) {
    for (const s of shardInfo.shards) {
      byShardNumber[s.shard] = byShardNumber[s.shard] || [];
      byShardNumber[s.shard].push(s);
    }
  }

  return (
    <div className="api-page">
      <h2>How a big table is split across a cluster</h2>
      <p className="form-hint">
        An RDBMS table lives whole on one server. An Elasticsearch index does not — it is cut
        into <b>shards</b> at creation time, and those shards are physical, independent Lucene
        indices that the cluster spreads across nodes. This is the mechanism that lets a single
        "table" scale past what one machine's disk/CPU/RAM could hold.
      </p>

      <div className="mapping-panel" style={{ marginBottom: 20 }}>
        <div style={{ color: "#a7f3d0", fontWeight: 600, marginBottom: 8 }}>
          Worked example: a high-volume <code>orders</code> table
        </div>
        <p className="form-hint" style={{ marginTop: 0 }}>
          Say a large ecommerce retailer logs 500 million order-line documents a year into one index, on a
          6-node cluster. You create it with <code>number_of_shards: 6</code>,{" "}
          <code>number_of_replicas: 1</code>.
        </p>
        <ol className="defaults-list" style={{ fontSize: 13, color: "#d6d9dd" }}>
          <li>
            ES immediately carves the index into 6 primary shards (P0..P5), each an independent
            Lucene index — none of them exist as a "whole index" anywhere, only as these pieces.
          </li>
          <li>
            With 1 replica, 6 more shards (R0..R5) are created as live copies, one per primary.
            That's 12 shard copies total.
          </li>
          <li>
            The master node lays them out one primary + one replica per node, and never places a
            shard's own replica on the same node as its primary — e.g. Node1: P0, R3 · Node2: P1,
            R4 · Node3: P2, R5 · Node4: P3, R0 · Node5: P4, R1 · Node6: P5, R2.
          </li>
          <li>
            When an order-line document is written, its target shard is fixed by{" "}
            <code>hash(_id) % 6</code> — so writes are spread roughly evenly across all 6 primaries,
            not funneled through one node.
          </li>
          <li>
            A search across the whole index fans out to all 6 shards in parallel (using whichever
            copy, primary or replica, is least busy), each searching only its ~83M-document slice,
            then the coordinating node merges the 6 result sets. This is why sharding also buys
            query parallelism, not just storage capacity.
          </li>
          <li>
            If Node3 dies, P2 is gone — but R2 lives on Node6, so it's instantly promoted to
            primary. No data lost, cluster goes yellow until a new replica is rebuilt elsewhere.
          </li>
        </ol>
        <p className="form-hint" style={{ marginBottom: 0 }}>
          Shard count is fixed at index-creation time precisely because that hash routing depends
          on it — changing shard count later means reindexing into a new index (<code>_reindex</code>
          or <code>_split</code>), not an in-place alter.
        </p>
      </div>

      <div className="panel-form">
        <h3>Live shard placement for your cluster</h3>
        {indices.length === 0 && <p className="hint">No indices yet — create one first.</p>}
        {indices.length > 0 && (
          <div className="form-row">
            <label>
              index
              <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                {indices.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {error && <p className="error">Error: {error}</p>}

        {shardInfo && (
          <>
            <p className="form-hint">
              This cluster has <b>{shardInfo.number_of_nodes}</b> node(s). This index has{" "}
              <b>{shardInfo.number_of_shards}</b> primary shard(s) and{" "}
              <b>{shardInfo.number_of_replicas}</b> replica(s) per shard —{" "}
              {shardInfo.number_of_nodes < 2 && (
                <>
                  since it's a single-node dev cluster, replicas can't actually be placed anywhere
                  and will show unassigned below (that's expected outside of a multi-node setup).
                </>
              )}
              {shardInfo.number_of_nodes >= 2 && <>see exactly where each copy landed below.</>}
            </p>
            <table className="mapping-table">
              <thead>
                <tr>
                  <th>Shard #</th>
                  <th>Copy</th>
                  <th>State</th>
                  <th>Docs</th>
                  <th>Size</th>
                  <th>Node</th>
                </tr>
              </thead>
              <tbody>
                {shardInfo.shards
                  .sort((a, b) => a.shard - b.shard || (a.prirep < b.prirep ? -1 : 1))
                  .map((s, i) => (
                    <tr key={i}>
                      <td>{s.shard}</td>
                      <td>{s.prirep}</td>
                      <td>{s.state}</td>
                      <td>{s.docs ?? "-"}</td>
                      <td>{s.store ?? "-"}</td>
                      <td>{s.node ?? <span className="hint">unassigned</span>}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("explorer"); // "explorer" | "crud" | "api" | "distributed" | "mcp"
  const [cluster, setCluster] = useState(null);
  const [structure, setStructure] = useState(null);
  const [error, setError] = useState(null);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [mapping, setMapping] = useState(null);
  const [docs, setDocs] = useState([]);
  const [query, setQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [creatingTableFor, setCreatingTableFor] = useState(null); // true | null
  const [addingRow, setAddingRow] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null); // doc | null

  const refreshStructure = () => {
    api("/api/structure").then(setStructure).catch((e) => setError(e.message));
  };

  useEffect(() => {
    api("/api/cluster").then(setCluster).catch((e) => setError(e.message));
    refreshStructure();
  }, []);

  const loadTable = (indexName) => {
    setSelectedIndex(indexName);
    setQuery("");
    setAddingRow(false);
    setEditingDoc(null);
    setLoading(true);
    Promise.all([
      api(`/api/tables/${indexName}/mapping`),
      api(`/api/tables/${indexName}/sample`),
    ])
      .then(([mappingRes, sampleRes]) => {
        setMapping(mappingRes);
        setDocs(sampleRes.docs);
        setTotal(sampleRes.total);
      })
      .finally(() => setLoading(false));
  };

  const runSearch = (e) => {
    e.preventDefault();
    if (!selectedIndex) return;
    if (!query.trim()) {
      loadTable(selectedIndex);
      return;
    }
    setLoading(true);
    api(`/api/tables/${selectedIndex}/search?q=${encodeURIComponent(query)}`)
      .then((data) => {
        setDocs(data.docs);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  };

  const handleTableCreated = () => {
    setCreatingTableFor(null);
    refreshStructure();
  };

  const handleDeleteTable = async () => {
    if (!selectedIndex) return;
    if (!confirm(`Drop table ${selectedIndex}? This cannot be undone.`)) return;
    await api(`/api/tables/${selectedIndex}`, { method: "DELETE" });
    setSelectedIndex(null);
    setMapping(null);
    setDocs([]);
    refreshStructure();
  };

  const handleAddRow = async (values) => {
    await api(`/api/tables/${selectedIndex}/documents`, {
      method: "POST",
      body: JSON.stringify(values),
    });
    setAddingRow(false);
    loadTable(selectedIndex);
  };

  const handleUpdateRow = async (values) => {
    await api(`/api/tables/${selectedIndex}/documents/${editingDoc._id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    setEditingDoc(null);
    loadTable(selectedIndex);
  };

  const handleDeleteRow = async (docId) => {
    if (!confirm(`Delete document ${docId}?`)) return;
    await api(`/api/tables/${selectedIndex}/documents/${docId}`, { method: "DELETE" });
    loadTable(selectedIndex);
  };

  const indexNames = structure
    ? Object.values(structure).flatMap((schemas) => Object.values(schemas)).flat().map((t) => t.index)
    : [];

  return (
    <div className="app">
      <header>
        <h1>Elastic RDBMS-style Explorer</h1>
        <p className="subtitle">
          server = cluster · table = index (the only real structural unit — no database/schema
          layer above it) · row = document · column = field
        </p>
      </header>

      <nav className="page-nav">
        <button
          className={page === "explorer" ? "page-tab active" : "page-tab"}
          onClick={() => setPage("explorer")}
        >
          Explorer
        </button>
        <button
          className={page === "crud" ? "page-tab active" : "page-tab"}
          onClick={() => setPage("crud")}
        >
          CRUD on Elastic
        </button>
        <button
          className={page === "api" ? "page-tab active" : "page-tab"}
          onClick={() => setPage("api")}
        >
          API Playground
        </button>
        <button
          className={page === "distributed" ? "page-tab active" : "page-tab"}
          onClick={() => setPage("distributed")}
        >
          Distributed
        </button>
        <button
          className={page === "mcp" ? "page-tab active" : "page-tab"}
          onClick={() => setPage("mcp")}
        >
          MCP Chat
        </button>
      </nav>

      {page === "api" && <ApiPlaygroundPage indices={indexNames} />}

      {page === "distributed" && <DistributedPage indices={indexNames} />}

      {page === "mcp" && <McpChatPage />}

      {page === "explorer" && (
        <>
      <ClusterBar cluster={cluster} />

      <ComparisonPanel
        cluster={cluster}
        selectedIndex={selectedIndex}
        mapping={mapping}
        docs={docs}
      />

      <NotesPanel />
      <RdbmsFeaturesPanel />
        </>
      )}

      {error && <p className="error">Error: {error}</p>}

      {page === "crud" && (
      <section className="crud-section">
        <h2 className="section-heading">CRUD on Elastic — index &amp; document (mapping-aware)</h2>
        <p className="section-subtitle">
          Create/drop tables (indices), and insert/edit/delete rows (documents). Row inserts and
          edits are validated against the selected table's mapping — new fields get added
          automatically, existing fields keep their locked-in type.
        </p>

      <div className="layout">
        <aside>
          {!structure && !error && <p>Loading structure...</p>}
          {structure && (
            <Tree
              structure={structure}
              selectedIndex={selectedIndex}
              onSelectTable={loadTable}
              onNewTableFor={() => setCreatingTableFor(true)}
            />
          )}
        </aside>

        <main>
          {creatingTableFor && (
            <CreateTableForm
              onCreated={handleTableCreated}
              onCancel={() => setCreatingTableFor(null)}
            />
          )}

          {!creatingTableFor && !selectedIndex && (
            <p className="hint">Select a table on the left, or create a new one.</p>
          )}

          {!creatingTableFor && selectedIndex && (
            <>
              <div className="table-header">
                <h2>{selectedIndex}</h2>
                <div className="table-actions">
                  <button onClick={() => setAddingRow((v) => !v)}>
                    {addingRow ? "Cancel add row" : "+ Add row"}
                  </button>
                  <button className="danger" onClick={handleDeleteTable}>
                    Drop table
                  </button>
                </div>

                <MappingPanel mapping={mapping} />

                <form onSubmit={runSearch} className="search-form">
                  <input
                    type="text"
                    placeholder="full-text search this table..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button type="submit">Search</button>
                </form>
                <div className="form-hint" style={{ marginTop: 8, marginBottom: 8 }}>
                  <strong>How this search works:</strong> you're not required to type{" "}
                  <code>field:value</code>. This box sends your text to ES as a{" "}
                  <code>multi_match</code> query, scoped to every <code>text</code> field in this
                  index's mapping (see the mapping panel above) -- so one query checks the
                  inverted index of <em>each</em> text field and merges/scores the matches, no
                  column name needed. That's different from a plain <code>match</code> query,
                  which checks only one named field (<code>{"{ match: { name: \"audio\" } }"}</code>),
                  and different again from ES's <code>_msearch</code> API, which bundles several
                  independent queries into one request -- not the same as searching many fields.
                  <div style={{ marginTop: 10, fontWeight: 600, color: "#a7f3d0" }}>
                    Why is this fast?
                  </div>
                  <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                    <li>
                      <code>text</code> fields (like <code>name</code>, <code>desc</code>) are
                      tokenized -- split into words -- and each word is mapped to a list of doc
                      IDs. This happens separately for every <code>text</code> field: <code>name</code>{" "}
                      gets its own word-to-doclist table, <code>desc</code> gets its own separate one.
                      They don't merge.
                    </li>
                    <li>
                      <code>keyword</code> fields (<code>id</code>, <code>sku</code>) are NOT split.
                      The whole value is treated as one single token, mapped to doc IDs -- good for
                      exact match, not partial search.
                    </li>
                    <li>
                      Numeric fields (<code>cost</code>, <code>price</code>, <code>stock_qty</code>)
                      aren't tokenized at all (splitting a number makes no sense); they're stored in
                      a different structure entirely (a BKD-tree) built for range queries like{" "}
                      <code>cost {">"} 20</code>.
                    </li>
                  </ul>
                  <p style={{ marginTop: 8, marginBottom: 0 }}>
                    All of this -- every field's structure -- lives inside that one index's own
                    storage, built automatically the moment a document is inserted, based on what
                    type each field was declared as in the mapping. A search never scans your
                    documents: it looks up the word (or exact value, or number range) directly in
                    the field's own prebuilt structure and gets back a doc-ID list -- a lookup, not
                    a scan. That's why the response time barely changes whether the table has 10
                    rows or 10 million.
                  </p>
                </div>
                <p className="result-count">{loading ? "Loading..." : `${total} result(s)`}</p>
              </div>

              {addingRow && mapping && (
                <RowForm
                  columns={mapping.columns}
                  onSubmit={handleAddRow}
                  onCancel={() => setAddingRow(false)}
                  submitLabel="Insert row"
                />
              )}

              {editingDoc && mapping && (
                <RowForm
                  columns={mapping.columns}
                  initialValues={editingDoc}
                  onSubmit={handleUpdateRow}
                  onCancel={() => setEditingDoc(null)}
                  submitLabel="Save row"
                />
              )}

              <DocTable
                docs={docs}
                columns={mapping?.columns || []}
                onEdit={setEditingDoc}
                onDelete={handleDeleteRow}
              />
            </>
          )}
        </main>
      </div>
      </section>
      )}
    </div>
  );
}
