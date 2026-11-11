'use client';
import React from 'react';
import './DentzyChartTable.css';
import { DentzyKpiRow } from './DentzyCard';

const DEFAULT_STAGES = [
  { key: 'received', label: 'Received' },
  { key: 'design', label: 'Design' },
  { key: 'production', label: 'Production' },
  { key: 'qc', label: 'QC' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'completed', label: 'Completed' },
];

/**
 * DentzyDataTable — Bounded 14px Card Table with optional 3-Metric KPI Rollup Strip
 *
 * @param {object} props
 * @param {Array<{label:string, value:React.ReactNode, valueColor?:string}>} [props.kpiItems]
 * @param {Array<{key:string, header:React.ReactNode, width?:string, align?:string, render:(row:any, idx:number)=>React.ReactNode}>} props.columns
 * @param {Array<any>} props.data
 * @param {function} [props.rowKey] - (row) => string
 * @param {function} [props.onRowClick] - (row) => void
 * @param {boolean}  [props.selectable=false]
 * @param {Array<string>} [props.selectedIds=[]]
 * @param {function} [props.onToggleSelect] - (id) => void
 * @param {function} [props.onToggleSelectAll] - () => void
 * @param {React.ReactNode} [props.footer]
 */
export function DentzyDataTable({
  kpiItems,
  columns = [],
  data = [],
  rowKey = (r) => r._id || r.id || r.caseId,
  onRowClick,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  footer,
}) {
  const allSelected = data.length > 0 && data.every((r) => selectedIds.includes(rowKey(r)));

  return (
    <div>
      {kpiItems && kpiItems.length > 0 && <DentzyKpiRow items={kpiItems} />}
      <div className="dz-table-shell">
        <table className="dz-data-table">
          <thead>
            <tr>
              {selectable && (
                <th style={{ width: '38px', textAlign: 'center', padding: '10px 8px' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    aria-label="Select all rows"
                    style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#1e5038' }}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const id = rowKey(row);
              const isSelected = selectable && selectedIds.includes(id);
              const rowBg = isSelected ? '#edf5f0' : idx % 2 === 0 ? '#ffffff' : '#f8faf9';

              return (
                <tr
                  key={id || idx}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'dz-table-row--clickable' : ''}
                  style={{ background: rowBg }}
                >
                  {selectable && (
                    <td
                      style={{ width: '38px', textAlign: 'center', padding: '10px 8px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect?.(id)}
                        aria-label={`Select row ${id}`}
                        style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#1e5038' }}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                      {col.render ? col.render(row, idx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        {footer}
      </div>
    </div>
  );
}

/**
 * DentzyPipelineChart — Shared Horizontal Stage Progress Chart
 */
export function DentzyPipelineChart({ stage, stages = DEFAULT_STAGES }) {
  const idx = stages.findIndex((s) => s.key === stage);
  return (
    <div className="dz-stage-chart">
      {stages.map((s, i) => (
        <React.Fragment key={s.key}>
          <div
            className={[
              'dz-stage-node',
              i <= idx ? 'dz-stage-node--done' : '',
              i === idx ? 'dz-stage-node--current' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="dz-stage-dot" />
            <span className="dz-stage-label">{s.label}</span>
          </div>
          {i < stages.length - 1 && (
            <div className={`dz-stage-line ${i < idx ? 'dz-stage-line--done' : ''}`.trim()} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default DentzyDataTable;
