import { useState, useEffect, useMemo, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  getPacketDefinition,
  parsePacket,
  ParseResult,
  ParsedField,
  ParsedValue,
  DecompressionResult,
} from "../packet-parser";

interface PacketData {
  id: number;
  timestamp: number;
  direction: string;
  opcode: number;
  opcode_name: string;
  size: number;
  data: number[];
}

interface PacketDetailProps {
  sessionId: string | null;
  packetId: number | null;
  build: number | null;
  onClose: () => void;
}

function formatOpcode(opcode: number): string {
  return `0x${opcode.toString(16).toUpperCase().padStart(4, "0")}`;
}

function hexDump(data: number[]): { offset: string; hex: string; ascii: string }[] {
  const lines: { offset: string; hex: string; ascii: string }[] = [];

  for (let i = 0; i < data.length; i += 16) {
    const chunk = data.slice(i, i + 16);

    const offset = i.toString(16).toUpperCase().padStart(8, "0");

    const hexParts: string[] = [];
    for (let j = 0; j < 16; j++) {
      if (j < chunk.length) {
        hexParts.push(chunk[j].toString(16).toUpperCase().padStart(2, "0"));
      } else {
        hexParts.push("  ");
      }
      if (j === 7) hexParts.push("");
    }
    const hex = hexParts.join(" ");

    const ascii = chunk
      .map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : "."))
      .join("");

    lines.push({ offset, hex, ascii });
  }

  return lines;
}

function formatValue(value: ParsedValue): string {
  switch (value.kind) {
    case "number":
      return value.display ?? value.value.toString();
    case "bigint":
      return value.value;
    case "string":
      return `"${value.value}"`;
    case "bool":
      return value.value ? "true" : "false";
    case "enum":
      return `${value.name} (${value.value})`;
    case "flags": {
      const set = value.flags.filter((f) => f.set).map((f) => f.name);
      return set.length > 0
        ? `0x${value.value.toString(16).toUpperCase()} [${set.join(", ")}]`
        : `0x${value.value.toString(16).toUpperCase()} (none)`;
    }
    case "struct":
      return `{...}`;
    case "array":
      return `${value.items.length} items`;
  }
}

function formatParsedFields(fields: ParsedField[], depth = 0): string {
  const indent = "  ".repeat(depth);
  const lines: string[] = [];
  for (const field of fields) {
    lines.push(`${indent}${field.name}  ${field.typeName}  ${formatValue(field.value)}  @${field.offset}`);
    if (field.value.kind === "struct") {
      lines.push(formatParsedFields(field.value.fields, depth + 1));
    } else if (field.value.kind === "array") {
      for (let i = 0; i < field.value.items.length; i++) {
        const item = field.value.items[i];
        if (item.kind === "struct") {
          lines.push(`${"  ".repeat(depth + 1)}[${i}]  {...}`);
          lines.push(formatParsedFields(item.fields, depth + 2));
        } else {
          lines.push(`${"  ".repeat(depth + 1)}[${i}]  ${formatValue(item)}`);
        }
      }
    }
  }
  return lines.join("\n");
}

function FieldRow({ field, depth = 0 }: { field: ParsedField; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const indent = depth * 16;
  const isExpandable = field.value.kind === "struct" || field.value.kind === "array";

  return (
    <div className="parsed-field">
      <div
        className={`parsed-field-row${isExpandable ? " expandable" : ""}`}
        style={{ paddingLeft: 12 + indent }}
        onClick={isExpandable ? () => setExpanded(!expanded) : undefined}
      >
        {isExpandable && (
          <span className="expand-toggle">{expanded ? "\u25BC" : "\u25B6"}</span>
        )}
        <span className="field-name">{field.name}</span>
        <span className="field-type">{field.typeName}</span>
        {(!isExpandable || !expanded) && (
          <span className="field-value">{formatValue(field.value)}</span>
        )}
        <span className="field-offset">@{field.offset}</span>
      </div>
      {expanded && field.value.kind === "struct" && (
        <div className="parsed-field-children">
          {field.value.fields.map((child, i) => (
            <FieldRow key={i} field={child} depth={depth + 1} />
          ))}
        </div>
      )}
      {expanded && field.value.kind === "array" && field.value.items.length > 0 && (
        <div className="parsed-field-children">
          {field.value.items.map((item, i) => {
            if (item.kind === "struct") {
              return (
                <ArrayStructItem key={i} index={i} item={item} depth={depth + 1} />
              );
            }
            return (
              <div
                key={i}
                className="parsed-field-row"
                style={{ paddingLeft: 12 + (depth + 1) * 16 }}
              >
                <span className="field-name">[{i}]</span>
                <span className="field-value">{formatValue(item)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ArrayStructItem({
  index,
  item,
  depth,
}: {
  index: number;
  item: ParsedValue & { kind: "struct" };
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const indent = depth * 16;

  return (
    <div className="parsed-field">
      <div
        className="parsed-field-row expandable"
        style={{ paddingLeft: 12 + indent }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="expand-toggle">{expanded ? "\u25BC" : "\u25B6"}</span>
        <span className="field-name">[{index}]</span>
        {!expanded && <span className="field-value">{`{...}`}</span>}
      </div>
      {expanded &&
        item.fields.map((child, j) => (
          <FieldRow key={j} field={child} depth={depth + 1} />
        ))}
    </div>
  );
}

export default function PacketDetail({
  sessionId,
  packetId,
  build,
  onClose,
}: PacketDetailProps) {
  const [packet, setPacket] = useState<PacketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"decompressed" | "raw">("decompressed");

  useEffect(() => {
    if (packetId === null || sessionId === null) {
      setPacket(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    invoke<PacketData | null>("get_packet_detail", {
      sessionId,
      id: packetId,
    }).then((p) => {
      if (!cancelled) {
        setPacket(p);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [sessionId, packetId]);

  // Reset view mode when switching packets
  useEffect(() => {
    setViewMode("decompressed");
  }, [packetId]);

  // Attempt decompression if definition has compression info
  const compressionData = useMemo<{
    decompression: DecompressionResult | null;
    decompressError: string | null;
    innerOpcode: number;
  } | null>(() => {
    if (!packet || !build) return null;
    const definition = getPacketDefinition(build, packet.opcode, packet.direction);
    if (!definition?.compression) return null;

    try {
      const decompression = definition.compression.decompress(packet.data);
      return { decompression, decompressError: null, innerOpcode: definition.compression.innerOpcode };
    } catch (e) {
      return {
        decompression: null,
        decompressError: e instanceof Error ? e.message : String(e),
        innerOpcode: definition.compression.innerOpcode,
      };
    }
  }, [packet, build]);

  const isCompressedPacket = compressionData !== null;

  const parseResult: ParseResult | null = useMemo(() => {
    if (!packet || !build) return null;

    if (isCompressedPacket && viewMode === "decompressed") {
      if (!compressionData?.decompression) return null;
      const innerDef = getPacketDefinition(build, compressionData.innerOpcode, packet.direction);
      if (!innerDef) return null;
      return parsePacket(compressionData.decompression.data, innerDef);
    }

    const definition = getPacketDefinition(build, packet.opcode, packet.direction);
    if (!definition) return null;
    return parsePacket(packet.data, definition);
  }, [packet, build, viewMode, compressionData, isCompressedPacket]);

  // Use decompressed data for hex dump when in decompressed mode
  const displayData = useMemo(() => {
    if (isCompressedPacket && viewMode === "decompressed" && compressionData?.decompression) {
      return compressionData.decompression.data;
    }
    return packet?.data ?? [];
  }, [packet, viewMode, compressionData, isCompressedPacket]);

  const copyPacketToClipboard = useCallback(() => {
    if (!packet) return;
    const copyLines = hexDump(displayData);
    const hexText = copyLines
      .map((l) => `${l.offset}  ${l.hex}  ${l.ascii}`)
      .join("\n");

    const sections = [
      `Packet ID: #${packet.id}`,
      `Direction: ${packet.direction}`,
      `Opcode: ${formatOpcode(packet.opcode)} (${packet.opcode_name})`,
      `Payload Size: ${packet.size} bytes`,
      `Timestamp: ${packet.timestamp} ms`,
    ];

    if (compressionData?.decompression) {
      const d = compressionData.decompression;
      sections.push(
        "",
        "--- Compression ---",
        `Compressed: ${d.compressedSize} bytes`,
        `Decompressed: ${d.actualSize} bytes`,
        `Ratio: ${((1 - d.compressedSize / d.actualSize) * 100).toFixed(1)}%`,
        `View: ${viewMode}`,
      );
    }

    sections.push(
      "",
      "--- Hex Dump ---",
      hexText || "(no payload data)",
    );

    if (parseResult) {
      sections.push("", "--- Parsed Structure ---");
      sections.push(formatParsedFields(parseResult.fields));
      if (parseResult.error) {
        sections.push(`Parse error: ${parseResult.error}`);
      }
    }

    navigator.clipboard.writeText(sections.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [packet, parseResult, displayData, compressionData, viewMode]);

  if (packetId === null) {
    return <div className="packet-detail hidden" />;
  }

  if (loading || !packet) {
    return (
      <div className="packet-detail">
        <div className="detail-header">
          <h3>Packet Detail</h3>
          <button className="detail-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="empty-state">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const lines = hexDump(displayData);

  return (
    <div className="packet-detail">
      <div className="detail-header">
        <h3>
          {packet.direction} - {packet.opcode_name}
        </h3>
        <div className="detail-header-actions">
          <button
            className={`detail-copy${copied ? " copied" : ""}`}
            onClick={copyPacketToClipboard}
            title="Copy packet info"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
          <button className="detail-close" onClick={onClose}>
            &times;
          </button>
        </div>
      </div>

      <div className="detail-info">
        <div className="detail-info-row">
          <span className="label">Packet ID</span>
          <span className="value">#{packet.id}</span>
        </div>
        <div className="detail-info-row">
          <span className="label">Direction</span>
          <span
            className="value"
            style={{
              color:
                packet.direction === "CMSG" ? "var(--cmsg-color)" : "var(--smsg-color)",
            }}
          >
            {packet.direction}
          </span>
        </div>
        <div className="detail-info-row">
          <span className="label">Opcode</span>
          <span className="value">
            {formatOpcode(packet.opcode)} ({packet.opcode_name})
          </span>
        </div>
        <div className="detail-info-row">
          <span className="label">Payload Size</span>
          <span className="value">{packet.size} bytes</span>
        </div>
        <div className="detail-info-row">
          <span className="label">Timestamp</span>
          <span className="value">{packet.timestamp} ms</span>
        </div>
      </div>

      {isCompressedPacket && (
        <div className="compression-section">
          <div className="compression-toggle">
            <button
              className={`toggle-btn${viewMode === "decompressed" ? " active" : ""}`}
              onClick={() => setViewMode("decompressed")}
            >
              Decompressed
            </button>
            <button
              className={`toggle-btn${viewMode === "raw" ? " active" : ""}`}
              onClick={() => setViewMode("raw")}
            >
              Raw
            </button>
          </div>
          {compressionData?.decompression && (
            <div className="compression-stats">
              <div className="detail-info-row">
                <span className="label">Compressed</span>
                <span className="value">
                  {compressionData.decompression.compressedSize} bytes
                </span>
              </div>
              <div className="detail-info-row">
                <span className="label">Decompressed</span>
                <span className="value">
                  {compressionData.decompression.actualSize} bytes
                </span>
              </div>
              <div className="detail-info-row">
                <span className="label">Ratio</span>
                <span className="value">
                  {(
                    (1 -
                      compressionData.decompression.compressedSize /
                        compressionData.decompression.actualSize) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              {compressionData.decompression.declaredSize !==
                compressionData.decompression.actualSize && (
                <div className="detail-info-row">
                  <span className="label" style={{ color: "var(--accent)" }}>
                    Size Mismatch
                  </span>
                  <span className="value" style={{ color: "var(--accent)" }}>
                    declared {compressionData.decompression.declaredSize} vs
                    actual {compressionData.decompression.actualSize}
                  </span>
                </div>
              )}
            </div>
          )}
          {compressionData?.decompressError && (
            <div className="compression-error">
              Decompression failed: {compressionData.decompressError}
            </div>
          )}
        </div>
      )}

      {parseResult && (
        <div className="parsed-structure">
          <div className="parsed-structure-header">
            <span className="parsed-structure-title">
              {isCompressedPacket && viewMode === "decompressed"
                ? "Parsed Structure (Decompressed)"
                : "Parsed Structure"}
              {!parseResult.success && (
                <span className="parse-warning" title={parseResult.error}>
                  {"\u26A0"}
                </span>
              )}
            </span>
            <span className="parsed-structure-meta">
              {parseResult.bytesConsumed}/{displayData.length} bytes
            </span>
          </div>
          <div className="parsed-structure-body">
            {parseResult.fields.map((field, i) => (
              <FieldRow key={i} field={field} />
            ))}
            {parseResult.error && (
              <div className="parse-error-message">
                Parse error: {parseResult.error}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="hex-dump">
        {lines.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
            No payload data
          </div>
        ) : (
          lines.map((line, i) => (
            <div key={i} className="hex-line">
              <span className="hex-offset">{line.offset}  </span>
              <span className="hex-bytes">{line.hex}  </span>
              <span className="hex-ascii">{line.ascii}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
