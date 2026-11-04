import React, { useState, useEffect } from 'react';
import { 
  Database, Play, CheckCircle2, Copy, Check, Terminal, 
  Layers, ShieldCheck, GitCommit, Workflow, ArrowRight, 
  Lock, Unlock, RotateCcw, FileCheck, Eye, Sparkles, AlertCircle, 
  Table, ChevronRight, Activity, ArrowDownRight, RefreshCw, Info,
  Network
} from 'lucide-react';
import { 
  fetchAdbmsSummary, 
  fetchAdbmsEntities, 
  fetchAdbmsRelationships, 
  fetchAdbmsNormalization, 
  fetchAdbmsQueries, 
  fetchAdbmsProcedures, 
  callAdbmsProcedureApi, 
  simulateAdbmsTransactionApi, 
  validateAdbmsRecordApi, 
  fetchAdbmsTelemetry 
} from '../services/api';

interface AdbmsPhasesWorkbenchProps {
  onLoadSql: (sql: string) => void;
  onRunSql: (sql: string) => Promise<void>;
  currentSql?: string;
}

export const AdbmsPhasesWorkbench: React.FC<AdbmsPhasesWorkbenchProps> = ({
  onLoadSql,
  onRunSql
}) => {
  const [activePhase, setActivePhase] = useState<1 | 2 | 3 | 4>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Phase 1 States
  const [phase1Tab, setPhase1Tab] = useState<'er_diagram' | 'normalization' | 'entities'>('er_diagram');
  const [selectedNormalization, setSelectedNormalization] = useState<'UNF' | '1NF' | '2NF' | '3NF'>('3NF');
  const [entities, setEntities] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [normalizationSteps, setNormalizationSteps] = useState<any[]>([]);
  const [selectedEntityName, setSelectedEntityName] = useState<string>('fact_video_metrics');

  // Phase 2 States
  const [phase2Tab, setPhase2Tab] = useState<'tables' | 'nulls' | 'constraints' | 'aggregates'>('tables');

  // Phase 3 States
  const [phase3Tab, setPhase3Tab] = useState<'joins' | 'subqueries' | 'views' | 'procedures'>('joins');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('ash_vid_adv_01');
  const [procedureOutput, setProcedureOutput] = useState<any | null>(null);
  const [isCallingProcedure, setIsCallingProcedure] = useState(false);

  // Phase 4 States
  const [phase4Tab, setPhase4Tab] = useState<'transactions' | 'concurrency' | 'validation'>('transactions');
  const [txScenario, setTxScenario] = useState<'commit' | 'rollback_to_savepoint' | 'full_rollback'>('commit');
  const [txViewsDelta, setTxViewsDelta] = useState<number>(25000);
  const [txResult, setTxResult] = useState<any | null>(null);
  const [isSimulatingTx, setIsSimulatingTx] = useState(false);

  // Validation Form state
  const [valDuration, setValDuration] = useState<number>(1400);
  const [valRetention, setValRetention] = useState<number>(72.5);
  const [valCtr, setValCtr] = useState<number>(12.4);
  const [valChannelId, setValChannelId] = useState<string>('ashrides26_official');
  const [valAudioProfile, setValAudioProfile] = useState<string>('SC-Project Exhaust + Helmet Mic');
  const [valResult, setValResult] = useState<any | null>(null);

  // Queries list
  const [adbmsQueries, setAdbmsQueries] = useState<any[]>([]);
  const [adbmsProcedures, setAdbmsProcedures] = useState<any[]>([]);

  useEffect(() => {
    fetchAdbmsEntities().then((res) => { if (res?.entities) setEntities(res.entities); }).catch(() => {});
    fetchAdbmsRelationships().then((res) => { if (res?.relationships) setRelationships(res.relationships); }).catch(() => {});
    fetchAdbmsNormalization().then((res) => { if (res?.normalization) setNormalizationSteps(res.normalization); }).catch(() => {});
    fetchAdbmsQueries().then((res) => { if (res?.queries) setAdbmsQueries(res.queries); }).catch(() => {});
    fetchAdbmsProcedures().then((res) => { if (res?.procedures) setAdbmsProcedures(res.procedures); }).catch(() => {});
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSimulateTransaction = async () => {
    setIsSimulatingTx(true);
    try {
      const res = await simulateAdbmsTransactionApi(txScenario, selectedVideoId, txViewsDelta);
      setTxResult(res);
    } catch (err: any) {
      setTxResult({ error: err?.message || 'Transaction failed' });
    } finally {
      setIsSimulatingTx(false);
    }
  };

  const handleCallProcedure = async (procName: string) => {
    setIsCallingProcedure(true);
    setProcedureOutput(null);
    try {
      const params = procName.includes('GetVideoTelemetryReport') 
        ? { p_video_id: selectedVideoId }
        : procName.includes('CalculateChannelGrowthKPIs')
        ? { p_channel_id: 'ashrides26_official' }
        : { p_video_id: selectedVideoId, p_additional_views: 12500 };
      
      const res = await callAdbmsProcedureApi(procName, params);
      setProcedureOutput(res);
    } catch (err: any) {
      setProcedureOutput({ error: err?.message || 'Procedure call failed' });
    } finally {
      setIsCallingProcedure(false);
    }
  };

  const handleValidateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidateRecord = {
      video_id: `test_vid_${Date.now()}`,
      title: 'Validation Test Motovlog',
      duration_seconds: valDuration,
      retention_pct: valRetention,
      ctr_pct: valCtr,
      channel_id: valChannelId,
      audio_sound_profile: valAudioProfile.trim() === '' ? null : valAudioProfile
    };
    try {
      const res = await validateAdbmsRecordApi('fact_video_metrics', candidateRecord);
      setValResult(res);
    } catch (err: any) {
      setValResult({ valid: false, errors: [err?.message || 'Validation request failed'] });
    }
  };

  const phasesInfo = [
    {
      num: 1,
      name: 'Phase 1: Data Modelling',
      short: 'Modelling & 3NF',
      desc: 'Entities, Attributes, Relationships, Visual ER Diagram & 3NF Normalization.',
      icon: Network,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      num: 2,
      name: 'Phase 2: Database Creation',
      short: 'DDL & Aggregates',
      desc: 'MySQL 8.0 Tables, NULL Handling, Constraints Audit & Multi-Level Aggregates.',
      icon: Table,
      color: 'from-cyan-500 to-teal-500',
    },
    {
      num: 3,
      name: 'Phase 3: Data Querying',
      short: 'JOINs & Analytics',
      desc: 'Relational JOINs, Subqueries, Views, Stored Procedures & Window Functions.',
      icon: Workflow,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      num: 4,
      name: 'Phase 4: Data Integrity',
      short: 'ACID & Integrity',
      desc: 'COMMIT, ROLLBACK, SAVEPOINT, Concurrency Control, Locks & Data Validation.',
      icon: ShieldCheck,
      color: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="space-y-6" id="adbms-phases-container">
      {/* 4 Phases Navigation Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {phasesInfo.map((p) => {
          const Icon = p.icon;
          const isActive = activePhase === p.num;
          return (
            <button
              key={p.num}
              onClick={() => setActivePhase(p.num as 1 | 2 | 3 | 4)}
              className={`p-4 rounded-xl border text-left transition relative overflow-hidden group cursor-pointer ${
                isActive
                  ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono ${
                  isActive ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-cyan-300'
                }`}>
                  P{p.num}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                }`}>
                  COMPLETE ✓
                </span>
              </div>
              <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{p.short}</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {p.desc}
              </p>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          PHASE 1: DATA MODELLING & 3NF NORMALIZATION
      ===================================================================== */}
      {activePhase === 1 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-6">
          {/* Phase 1 Header & Sub-tabs */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Phase 1: Relational Data Modelling & 3NF Normalization
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Motovlogging entities, attributes, primary/foreign keys, Crow&apos;s Foot cardinalities, and 3NF decomposition.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setPhase1Tab('er_diagram')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase1Tab === 'er_diagram' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Interactive ER Diagram
              </button>
              <button
                onClick={() => setPhase1Tab('normalization')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase1Tab === 'normalization' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                3NF Normalization
              </button>
              <button
                onClick={() => setPhase1Tab('entities')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase1Tab === 'entities' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Entities Catalog ({entities.length || 8})
              </button>
            </div>
          </div>

          {/* Sub-view 1: Interactive ER Diagram */}
          {phase1Tab === 'er_diagram' && (
            <div className="space-y-6">
              {/* ER Overview Cardinality Banner */}
              <div className="p-4 rounded-xl bg-[#070b13] border border-cyan-500/20 text-xs font-mono flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-white font-bold">Relational Schema Notation:</span>
                    <span className="text-slate-400 ml-2">Crow&apos;s Foot Notation • 1:1, 1:N, and N:M with Referential Integrity</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> PK (Primary Key)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-cyan-400 inline-block" /> FK (Foreign Key)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" /> InnoDB Cascade
                  </span>
                </div>
              </div>

              {/* ER Diagram Visual Nodes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(entities.length > 0 ? entities : [
                  { name: 'dim_channels', type: 'Dimension', primaryKey: 'channel_id', attributes: [{ name: 'channel_id', type: 'VARCHAR(64)', constraint: 'PK' }, { name: 'handle', type: 'VARCHAR(64)', constraint: 'UNIQUE' }, { name: 'subscribers', type: 'BIGINT' }, { name: 'total_views', type: 'BIGINT' }] },
                  { name: 'fact_video_metrics', type: 'Fact', primaryKey: 'video_id', attributes: [{ name: 'video_id', type: 'VARCHAR(64)', constraint: 'PK' }, { name: 'channel_id', type: 'VARCHAR(64)', constraint: 'FK' }, { name: 'title', type: 'VARCHAR(255)' }, { name: 'retention_pct', type: 'DECIMAL(5,2)' }] },
                  { name: 'fact_video_retention', type: 'Fact', primaryKey: 'id', attributes: [{ name: 'id', type: 'BIGINT', constraint: 'PK' }, { name: 'video_id', type: 'VARCHAR(64)', constraint: 'FK' }, { name: 'second_mark', type: 'INT' }, { name: 'pct_retention', type: 'DECIMAL(5,2)' }] },
                  { name: 'fact_bike_telemetry', type: 'Fact', primaryKey: 'telemetry_id', attributes: [{ name: 'telemetry_id', type: 'VARCHAR(64)', constraint: 'PK' }, { name: 'video_id', type: 'VARCHAR(64)', constraint: 'FK (UNIQUE)' }, { name: 'top_speed_mph', type: 'DECIMAL(5,1)' }, { name: 'avg_lean_angle_deg', type: 'DECIMAL(4,1)' }] },
                  { name: 'dim_sponsors_partnerships', type: 'Dimension', primaryKey: 'sponsor_id', attributes: [{ name: 'sponsor_id', type: 'VARCHAR(64)', constraint: 'PK' }, { name: 'brand_name', type: 'VARCHAR(128)' }, { name: 'category', type: 'VARCHAR(64)' }] },
                  { name: 'fact_video_sponsorships', type: 'Bridge', primaryKey: '(video_id, sponsor_id)', attributes: [{ name: 'video_id', type: 'VARCHAR(64)', constraint: 'PK, FK' }, { name: 'sponsor_id', type: 'VARCHAR(64)', constraint: 'PK, FK' }, { name: 'payout_usd', type: 'DECIMAL(10,2)' }] }
                ]).map((ent: any) => (
                  <div
                    key={ent.name}
                    onClick={() => setSelectedEntityName(ent.name)}
                    className={`rounded-xl border p-4 space-y-3 cursor-pointer transition ${
                      selectedEntityName === ent.name 
                        ? 'bg-slate-900 border-cyan-500/80 ring-1 ring-cyan-500/30' 
                        : 'bg-[#0a0f1a] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">{ent.name}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                            ent.type === 'Fact' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : ent.type === 'Bridge'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {ent.type}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          PK: <span className="text-amber-400 font-bold">{ent.primaryKey}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 font-mono text-[11px]">
                      {ent.attributes?.slice(0, 5).map((attr: any) => (
                        <div key={attr.name} className="flex items-center justify-between text-slate-300">
                          <span className="flex items-center gap-1.5">
                            {attr.constraint?.includes('PK') || attr.name === ent.primaryKey ? (
                              <span className="w-2 h-2 rounded-full bg-amber-400" title="Primary Key" />
                            ) : attr.constraint?.includes('FK') || attr.name.includes('_id') ? (
                              <span className="w-2 h-2 rounded-full bg-cyan-400" title="Foreign Key" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                            )}
                            <span className={attr.constraint?.includes('PK') ? 'text-amber-300 font-bold' : ''}>
                              {attr.name}
                            </span>
                          </span>
                          <span className="text-slate-500 text-[10px]">{attr.type}</span>
                        </div>
                      ))}
                      {ent.attributes?.length > 5 && (
                        <div className="text-[10px] text-slate-500 pt-1">
                          +{ent.attributes.length - 5} more columns...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Relationships Explorer */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="text-white font-bold flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-cyan-400" />
                    <span>Relational Links & Cardinalities</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Foreign Key Integrity: ON DELETE CASCADE</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {(relationships.length > 0 ? relationships : [
                    { from: 'dim_channels', to: 'fact_video_metrics', cardinality: '1:N', description: 'One channel publishes many videos' },
                    { from: 'fact_video_metrics', to: 'fact_video_retention', cardinality: '1:N', description: 'One video has many retention plot points' },
                    { from: 'fact_video_metrics', to: 'fact_bike_telemetry', cardinality: '1:1', description: 'One video has at most 1 hardware telemetry log' },
                    { from: 'fact_video_metrics', to: 'dim_sponsors_partnerships', cardinality: 'N:M', description: 'Bridge table fact_video_sponsorships' },
                  ]).map((rel: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-white font-bold">
                          <span className="text-cyan-400">{rel.from}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-amber-300 font-bold">
                            {rel.cardinality}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-emerald-400">{rel.to}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{rel.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-view 2: 3NF Normalization Engine */}
          {phase1Tab === 'normalization' && (
            <div className="space-y-6">
              {/* Normalization Progress Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['UNF', '1NF', '2NF', '3NF'] as const).map((form) => (
                  <button
                    key={form}
                    onClick={() => setSelectedNormalization(form)}
                    className={`p-3 rounded-xl border text-center transition font-mono ${
                      selectedNormalization === form
                        ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-sm">{form}</div>
                    <div className="text-[10px] text-slate-500">
                      {form === 'UNF' ? 'Unnormalized' : form === '1NF' ? 'Atomic & PK' : form === '2NF' ? 'No Partial Dep' : 'No Transitive Dep'}
                    </div>
                  </button>
                ))}
              </div>

              {/* Normalization Step Details */}
              {(() => {
                const step = (normalizationSteps.length > 0 ? normalizationSteps : [
                  {
                    form: '3NF',
                    title: 'Third Normal Form (3NF) - Elimination of Transitive Dependencies',
                    rule: 'No non-key attribute is transitively dependent on the primary key (X -> Y and Y -> Z is decomposed).',
                    problemInPrevious: 'video_id -> channel_id, and channel_id -> subscribers. Updating channel subs required updating all video rows.',
                    solutionApplied: 'Decomposed channel master into dim_channels. fact_video_metrics holds only foreign key channel_id.',
                    functionalDependencies: ['video_id -> channel_id, title, category, views', 'channel_id -> name, handle, subscribers'],
                    tables: ['dim_channels', 'fact_video_metrics', 'fact_video_retention', 'fact_bike_telemetry']
                  }
                ]).find((s) => s.form === selectedNormalization) || normalizationSteps[3];

                if (!step) return null;

                return (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                          {step.form} Compliance
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5">{step.title}</h4>
                      </div>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Validated Relational Model
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Relational Rule:</span>
                        <p className="text-slate-200 leading-relaxed text-[11px]">{step.rule}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Transformation Applied:</span>
                        <p className="text-slate-200 leading-relaxed text-[11px]">{step.solutionApplied}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <span className="text-cyan-400 font-bold uppercase text-[10px]">
                        Functional Dependencies ($X \to Y$):
                      </span>
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        {step.functionalDependencies?.map((fd: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-cyan-400" />
                            <span>{fd}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
                      <strong>Conclusion:</strong> AshRides26 schema achieves full 3NF normalization. Every non-prime attribute is fully functionally dependent on the key, the whole key, and nothing but the key!
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Sub-view 3: Entities Catalog */}
          {phase1Tab === 'entities' && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-950 text-cyan-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Entity Table</th>
                      <th className="px-3 py-2">Relational Type</th>
                      <th className="px-3 py-2">Primary Key</th>
                      <th className="px-3 py-2">Foreign Keys</th>
                      <th className="px-3 py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {entities.map((e) => (
                      <tr key={e.name} className="hover:bg-slate-800/50">
                        <td className="px-3 py-2 font-bold text-white">{e.name}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300">
                            {e.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-amber-400">{e.primaryKey}</td>
                        <td className="px-3 py-2 text-slate-400">
                          {e.foreignKeys?.length ? e.foreignKeys.join(', ') : 'None (Master Table)'}
                        </td>
                        <td className="px-3 py-2 text-slate-400 max-w-xs truncate">{e.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          PHASE 2: DATABASE CREATION, NULLS, CONSTRAINTS & AGGREGATES
      ===================================================================== */}
      {activePhase === 2 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Table className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Phase 2: Database Creation & Multi-Level Aggregates
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                InnoDB table schemas, explicit NULL handling (COALESCE/NULLIF), constraints audit, and aggregate queries.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setPhase2Tab('tables')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase2Tab === 'tables' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                MySQL DDL Tables
              </button>
              <button
                onClick={() => setPhase2Tab('nulls')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase2Tab === 'nulls' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                NULL Handling
              </button>
              <button
                onClick={() => setPhase2Tab('constraints')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase2Tab === 'constraints' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Constraints Audit
              </button>
              <button
                onClick={() => setPhase2Tab('aggregates')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase2Tab === 'aggregates' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Aggregates Suite
              </button>
            </div>
          </div>

          {/* Sub-view: NULL Handling */}
          {phase2Tab === 'nulls' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-white font-bold flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Explicit NULL vs NOT NULL Architecture</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  In AshRides26, non-essential hardware telemetry is explicitly declared as nullable (e.g. <code>audio_sound_profile VARCHAR(128) NULL</code> when default helmet microphones are used, <code>battery_level INT NULL</code> for desktop sessions).
                  SQL functions <code>COALESCE()</code> and <code>NULLIF()</code> are leveraged to safeguard against division by zero and null-pointer calculation faults.
                </p>
              </div>

              {/* NULL Handling Demo Query */}
              <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold text-xs">COALESCE() & NULLIF() Demonstration Query</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onLoadSql(`SELECT 
    v.video_id,
    v.title,
    v.category,
    COALESCE(v.audio_sound_profile, 'Standard Helmet Audio (No Ext Mic)') AS resolved_audio_profile,
    COALESCE(v.top_demographic, 'General Audience (Insufficient Telemetry)') AS resolved_demographic,
    v.views,
    v.duration_seconds,
    ROUND(v.views / NULLIF(v.duration_seconds, 0), 2) AS view_density_factor
FROM fact_video_metrics v
ORDER BY v.views DESC
LIMIT 6;`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700"
                    >
                      Load in SQL Editor
                    </button>
                    <button
                      onClick={() => onRunSql(`SELECT 
    v.video_id,
    v.title,
    v.category,
    COALESCE(v.audio_sound_profile, 'Standard Helmet Audio (No Ext Mic)') AS resolved_audio_profile,
    COALESCE(v.top_demographic, 'General Audience (Insufficient Telemetry)') AS resolved_demographic,
    v.views,
    v.duration_seconds,
    ROUND(v.views / NULLIF(v.duration_seconds, 0), 2) AS view_density_factor
FROM fact_video_metrics v
ORDER BY v.views DESC
LIMIT 6;`)}
                      className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold rounded flex items-center gap-1 shadow"
                    >
                      <Play className="w-3 h-3 fill-current" /> Run Live
                    </button>
                  </div>
                </div>

                <pre className="p-3 bg-slate-950 rounded border border-slate-800 text-emerald-400 text-[11px] overflow-x-auto leading-relaxed">
{`SELECT 
    v.video_id,
    v.title,
    v.category,
    COALESCE(v.audio_sound_profile, 'Standard Helmet Audio (No Ext Mic)') AS resolved_audio_profile,
    COALESCE(v.top_demographic, 'General Audience (Insufficient Telemetry)') AS resolved_demographic,
    v.views,
    v.duration_seconds,
    ROUND(v.views / NULLIF(v.duration_seconds, 0), 2) AS view_density_factor
FROM fact_video_metrics v
ORDER BY v.views DESC
LIMIT 6;`}
                </pre>
              </div>
            </div>
          )}

          {/* Sub-view: Constraints Audit */}
          {phase2Tab === 'constraints' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-white font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Enforced Database Constraints Audit</span>
                </div>
                <p className="text-slate-400 text-xs">
                  Active database constraints in MySQL 8.0 ensuring referential integrity, range validity, and uniqueness.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-950 text-cyan-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Constraint Name</th>
                      <th className="px-3 py-2">Target Table</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Enforcement Rule</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {[
                      { name: 'chk_video_duration', table: 'fact_video_metrics', type: 'CHECK', rule: 'duration_seconds > 0', status: 'ACTIVE' },
                      { name: 'chk_video_retention', table: 'fact_video_metrics', type: 'CHECK', rule: 'retention_pct BETWEEN 0.00 AND 100.00', status: 'ACTIVE' },
                      { name: 'chk_video_ctr', table: 'fact_video_metrics', type: 'CHECK', rule: 'ctr_pct BETWEEN 0.00 AND 100.00', status: 'ACTIVE' },
                      { name: 'chk_top_speed', table: 'fact_bike_telemetry', type: 'CHECK', rule: 'top_speed_mph > 0', status: 'ACTIVE' },
                      { name: 'chk_lean_angle', table: 'fact_bike_telemetry', type: 'CHECK', rule: 'avg_lean_angle_deg BETWEEN 0.0 AND 65.0', status: 'ACTIVE' },
                      { name: 'fk_videos_channel', table: 'fact_video_metrics', type: 'FOREIGN KEY', rule: 'REFERENCES dim_channels(channel_id) ON DELETE CASCADE', status: 'ACTIVE' },
                      { name: 'fk_retention_video', table: 'fact_video_retention', type: 'FOREIGN KEY', rule: 'REFERENCES fact_video_metrics(video_id) ON DELETE CASCADE', status: 'ACTIVE' },
                      { name: 'uq_channel_handle', table: 'dim_channels', type: 'UNIQUE', rule: 'handle IS UNIQUE', status: 'ACTIVE' }
                    ].map((c) => (
                      <tr key={c.name} className="hover:bg-slate-800/50">
                        <td className="px-3 py-2 text-white font-bold">{c.name}</td>
                        <td className="px-3 py-2 text-cyan-300">{c.table}</td>
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-amber-300 font-bold">
                            {c.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-300">{c.rule}</td>
                        <td className="px-3 py-2 text-emerald-400 font-bold">✓ {c.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-view: DDL Tables */}
          {phase2Tab === 'tables' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">MySQL 8.0 InnoDB Production Tables</span>
                <button
                  onClick={() => onLoadSql(`SHOW TABLES;`)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700"
                >
                  SHOW TABLES in Editor
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'dim_channels', rows: 7, engine: 'InnoDB', desc: 'Channel profiles & subscriber stats' },
                  { name: 'fact_video_metrics', rows: 148, engine: 'InnoDB', desc: 'Video views, revenue, CTR & retention' },
                  { name: 'fact_video_retention', rows: 14280, engine: 'InnoDB', desc: 'Second-by-second audience attention plot points' },
                  { name: 'fact_bike_telemetry', rows: 6, engine: 'InnoDB', desc: 'Motorcycle speed, lean angles, dB levels' },
                  { name: 'fact_monthly_growth', rows: 12, engine: 'InnoDB', desc: 'Monthly subscriber additions & RPM' },
                  { name: 'dim_trending_alerts', rows: 8, engine: 'InnoDB', desc: 'Real-time velocity spikes & anomalies' }
                ].map((t) => (
                  <div key={t.name} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-sm">{t.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                        {t.engine}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{t.desc}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                      <span>Indexed Rows: {t.rows.toLocaleString()}</span>
                      <button
                        onClick={() => onRunSql(`SELECT * FROM ${t.name} LIMIT 10;`)}
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        Preview Data <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-view: Aggregates Suite */}
          {phase2Tab === 'aggregates' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-white font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Multi-Level Aggregate SQL Queries</span>
                </div>
                <p className="text-slate-400 text-xs">
                  Demonstrates COUNT(), SUM(), AVG(), MIN(), MAX(), GROUP BY, and HAVING aggregate filters.
                </p>
              </div>

              {adbmsQueries.filter((q) => q.phase === 2).map((q) => (
                <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white">{q.title}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{q.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onLoadSql(q.sql)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onRunSql(q.sql)}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" /> Run Live
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded border border-slate-800/80 text-emerald-400 text-[11px] overflow-x-auto leading-relaxed">
                    {q.sql}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          PHASE 3: DATA QUERYING (JOINS, SUBQUERIES, VIEWS, PROCEDURES)
      ===================================================================== */}
      {activePhase === 3 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Workflow className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Phase 3: Relational Data Querying & Analytical Procedures
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Relational JOINs, correlated subqueries, analytical views, and callable MySQL Stored Procedures.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setPhase3Tab('joins')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase3Tab === 'joins' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Relational JOINs
              </button>
              <button
                onClick={() => setPhase3Tab('subqueries')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase3Tab === 'subqueries' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Subqueries & EXISTS
              </button>
              <button
                onClick={() => setPhase3Tab('views')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase3Tab === 'views' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Relational Views (4)
              </button>
              <button
                onClick={() => setPhase3Tab('procedures')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase3Tab === 'procedures' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Stored Procedures
              </button>
            </div>
          </div>

          {/* Sub-view: Relational JOINs */}
          {phase3Tab === 'joins' && (
            <div className="space-y-4 font-mono text-xs">
              {adbmsQueries.filter((q) => q.subCategory?.includes('JOIN')).map((q) => (
                <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white">{q.title}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{q.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onLoadSql(q.sql)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onRunSql(q.sql)}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" /> Run Live
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded border border-slate-800/80 text-emerald-400 text-[11px] overflow-x-auto leading-relaxed">
                    {q.sql}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Sub-view: Subqueries */}
          {phase3Tab === 'subqueries' && (
            <div className="space-y-4 font-mono text-xs">
              {adbmsQueries.filter((q) => q.subCategory?.includes('Subquer')).map((q) => (
                <div key={q.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white">{q.title}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{q.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onLoadSql(q.sql)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => onRunSql(q.sql)}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" /> Run Live
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 bg-slate-900 rounded border border-slate-800/80 text-emerald-400 text-[11px] overflow-x-auto leading-relaxed">
                    {q.sql}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* Sub-view: Relational Views Explorer */}
          {phase3Tab === 'views' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-white font-bold flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Compiled MySQL Analytical Views</span>
                </div>
                <p className="text-slate-400 text-xs">
                  Pre-compiled views shielding complex multi-table logic into standard SQL queryable endpoints.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'v_category_performance_summary', desc: 'Aggregates video counts, retention %, duration, revenue, and view density by category.' },
                  { name: 'v_channel_benchmarks', desc: 'Competitor benchmarking view with average views per video, sub growth rate, and retention.' },
                  { name: 'v_viral_surge_telemetry', desc: 'Combines video velocity surges with physical motorcycle telemetry (lean angles, top speed, dB).' },
                  { name: 'v_retention_high_risk_chapters', desc: 'Isolates retention dropoff points and editorial notes where audience retention drops.' }
                ].map((v) => (
                  <div key={v.name} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">{v.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        VIEW
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{v.desc}</p>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => onLoadSql(`SELECT * FROM ${v.name};`)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700"
                      >
                        Load Query
                      </button>
                      <button
                        onClick={() => onRunSql(`SELECT * FROM ${v.name};`)}
                        className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-current" /> Execute View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-view: Stored Procedures */}
          {phase3Tab === 'procedures' && (
            <div className="space-y-5 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-white font-bold flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span>Callable MySQL Stored Procedures (IN & OUT Parameters)</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Select a procedure and trigger execution with live parameter binding.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Target Video:</span>
                  <select
                    value={selectedVideoId}
                    onChange={(e) => setSelectedVideoId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs"
                  >
                    <option value="ash_vid_adv_01">Gainesville to Asheville NC Adventure (ash_vid_adv_01)</option>
                    <option value="ash_vid_01">Ducati Panigale V4 S Track Review (ash_vid_01)</option>
                    <option value="ash_vid_02">Yamaha R1M vs BMW S1000RR Battle (ash_vid_02)</option>
                    <option value="ash_vid_10">Honda VFR800 VTEC Highway Run (ash_vid_10)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    name: 'sp_GetVideoTelemetryReport',
                    desc: 'Returns a 3-part dossier: Video KPIs, Physical Bike Sensors (Speed/Lean/dB), and Chapter dropoff/spike markers.',
                    callSql: `CALL sp_GetVideoTelemetryReport('${selectedVideoId}');`
                  },
                  {
                    name: 'sp_CalculateChannelGrowthKPIs',
                    desc: 'Computes cumulative revenue, effective RPM ($/1k views), and total views using MySQL OUT parameters.',
                    callSql: `CALL sp_CalculateChannelGrowthKPIs('ashrides26_official', @rev, @rpm, @views);`
                  },
                  {
                    name: 'sp_SimulateLiveTrafficSpike',
                    desc: 'Executes an atomic ACID transaction injecting +12,500 views, updating velocity, and firing an alert.',
                    callSql: `CALL sp_SimulateLiveTrafficSpike('${selectedVideoId}', 12500);`
                  }
                ].map((sp) => (
                  <div key={sp.name} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{sp.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">PROC</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{sp.desc}</p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => handleCallProcedure(sp.name)}
                        disabled={isCallingProcedure}
                        className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-1.5 shadow"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isCallingProcedure ? 'Calling Procedure...' : 'Execute Procedure'}</span>
                      </button>
                      <button
                        onClick={() => onRunSql(sp.callSql)}
                        className="w-full py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] rounded border border-slate-800"
                      >
                        Run CALL in SQL Editor
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Procedure Live Output Panel */}
              {procedureOutput && (
                <div className="p-4 rounded-xl bg-[#090e1a] border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-white font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Procedure Execution Output: {procedureOutput.procedure}</span>
                    </span>
                    <button
                      onClick={() => setProcedureOutput(null)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded border border-slate-800 text-cyan-300 text-[11px] overflow-x-auto leading-relaxed max-h-60">
                    {JSON.stringify(procedureOutput, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          PHASE 4: DATA INTEGRITY (TRANSACTIONS, CONCURRENCY, VALIDATION)
      ===================================================================== */}
      {activePhase === 4 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Phase 4: Data Integrity, ACID Transactions & Concurrency
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                COMMIT, ROLLBACK, SAVEPOINT transaction simulator, isolation levels, row-level locks, and data validation.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setPhase4Tab('transactions')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase4Tab === 'transactions' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ACID Transactions
              </button>
              <button
                onClick={() => setPhase4Tab('concurrency')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase4Tab === 'concurrency' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Concurrency & Locks
              </button>
              <button
                onClick={() => setPhase4Tab('validation')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  phase4Tab === 'validation' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Validation Engine
              </button>
            </div>
          </div>

          {/* Sub-view: ACID Transactions Simulator */}
          {phase4Tab === 'transactions' && (
            <div className="space-y-5 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-white font-bold flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Transaction Simulator (START TRANSACTION / SAVEPOINT / COMMIT / ROLLBACK)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Test realistic multi-statement operations on <code>fact_video_metrics</code> and <code>dim_trending_alerts</code>. 
                  Observe intermediate SAVEPOINT checkpoints, simulate rollbacks, or commit durably.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={() => setTxScenario('commit')}
                    className={`p-3 rounded-xl border text-left transition ${
                      txScenario === 'commit'
                        ? 'bg-emerald-500/20 border-emerald-500/80 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Scenario 1: Full COMMIT</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Update views &rarr; Set SAVEPOINT &rarr; Insert alert &rarr; COMMIT all changes durably.
                    </div>
                  </button>

                  <button
                    onClick={() => setTxScenario('rollback_to_savepoint')}
                    className={`p-3 rounded-xl border text-left transition ${
                      txScenario === 'rollback_to_savepoint'
                        ? 'bg-amber-500/20 border-amber-500/80 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      <span>Scenario 2: Rollback to SAVEPOINT</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Alert fails &rarr; ROLLBACK TO SAVEPOINT &rarr; Retain and COMMIT views update!
                    </div>
                  </button>

                  <button
                    onClick={() => setTxScenario('full_rollback')}
                    className={`p-3 rounded-xl border text-left transition ${
                      txScenario === 'full_rollback'
                        ? 'bg-rose-500/20 border-rose-500/80 text-rose-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Scenario 3: Full ROLLBACK</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Fatal integrity failure &rarr; ROLLBACK entire transaction (Atomicity guaranteed).
                    </div>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">Views Delta:</span>
                    <input
                      type="number"
                      value={txViewsDelta}
                      onChange={(e) => setTxViewsDelta(Number(e.target.value))}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white text-xs font-mono"
                    />
                  </div>

                  <button
                    onClick={handleSimulateTransaction}
                    disabled={isSimulatingTx}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-md flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isSimulatingTx ? 'animate-spin' : ''}`} />
                    <span>{isSimulatingTx ? 'Executing Transaction...' : `Simulate ${txScenario.toUpperCase()} Transaction`}</span>
                  </button>
                </div>
              </div>

              {/* Transaction Execution Steps Timeline */}
              {txResult && (
                <div className="p-4 rounded-xl bg-[#070b13] border border-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        Outcome: {txResult.outcome}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">{txResult.message}</h4>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <div>Video: <span className="text-cyan-300 font-bold">{txResult.dataSnapshot?.video_id}</span></div>
                      <div>Views: {txResult.dataSnapshot?.previous_views?.toLocaleString()} → <span className="text-emerald-400 font-bold">{txResult.dataSnapshot?.final_views?.toLocaleString()}</span></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Step-by-Step Transaction Log:</span>
                    {txResult.steps?.map((step: any) => (
                      <div key={step.step} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 text-[11px]">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                            {step.step}
                          </span>
                          <div>
                            <span className="text-cyan-300 font-bold">{step.action}</span>
                            <div className="text-slate-400 text-[10px] mt-0.5">{step.details}</div>
                            <code className="text-emerald-400 text-[10px] block mt-1">{step.sql}</code>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          step.status === 'COMMITTED' || step.status === 'SUCCESS' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : step.status === 'ROLLED_BACK'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sub-view: Concurrency & Locks */}
          {phase4Tab === 'concurrency' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-white font-bold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>MySQL 8.0 Transaction Isolation Levels & Locking Matrix</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  MySQL InnoDB defaults to <code>REPEATABLE READ</code> utilizing Next-Key Locking and Multi-Version Concurrency Control (MVCC) to prevent Dirty Reads and Non-Repeatable Reads.
                </p>
              </div>

              {/* Isolation Levels Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-950 text-cyan-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Isolation Level</th>
                      <th className="px-3 py-2">Dirty Reads</th>
                      <th className="px-3 py-2">Non-Repeatable Reads</th>
                      <th className="px-3 py-2">Phantom Reads</th>
                      <th className="px-3 py-2">AshRides26 Application</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {[
                      { level: 'READ UNCOMMITTED', dirty: 'Allowed', nonRepeat: 'Allowed', phantom: 'Allowed', desc: 'Not recommended. High risk of phantom telemetry readings.' },
                      { level: 'READ COMMITTED', dirty: 'Prevented ✓', nonRepeat: 'Allowed', phantom: 'Allowed', desc: 'Acceptable for rapid real-time dashboard telemetry scans.' },
                      { level: 'REPEATABLE READ (Default)', dirty: 'Prevented ✓', nonRepeat: 'Prevented ✓', phantom: 'Prevented (Next-Key) ✓', desc: 'Standard engine mode. MVCC snapshots guarantee consistency.' },
                      { level: 'SERIALIZABLE', dirty: 'Prevented ✓', nonRepeat: 'Prevented ✓', phantom: 'Prevented ✓', desc: 'Strictest mode. Used for financial sponsorship payouts.' }
                    ].map((row) => (
                      <tr key={row.level} className="hover:bg-slate-800/50">
                        <td className="px-3 py-2 font-bold text-white">{row.level}</td>
                        <td className={`px-3 py-2 ${row.dirty.includes('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>{row.dirty}</td>
                        <td className={`px-3 py-2 ${row.nonRepeat.includes('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>{row.nonRepeat}</td>
                        <td className={`px-3 py-2 ${row.phantom.includes('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>{row.phantom}</td>
                        <td className="px-3 py-2 text-slate-400 text-[11px]">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pessimistic Lock Query */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">Pessimistic Locking: SELECT ... FOR UPDATE</span>
                  <button
                    onClick={() => onLoadSql(`START TRANSACTION;
SELECT video_id, title, views, estimated_revenue_usd
FROM fact_video_metrics
WHERE video_id = 'ash_vid_01'
FOR UPDATE;
COMMIT;`)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-slate-700"
                  >
                    Load in Editor
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 rounded border border-slate-800 text-emerald-400 text-[11px] overflow-x-auto">
{`START TRANSACTION;
-- Acquires exclusive X-lock on the selected row preventing concurrent writes
SELECT video_id, title, views, estimated_revenue_usd
FROM fact_video_metrics
WHERE video_id = 'ash_vid_01'
FOR UPDATE;
UPDATE fact_video_metrics SET estimated_revenue_usd = estimated_revenue_usd + 250.00 WHERE video_id = 'ash_vid_01';
COMMIT;`}
                </pre>
              </div>
            </div>
          )}

          {/* Sub-view: Validation Engine */}
          {phase4Tab === 'validation' && (
            <div className="space-y-5 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-white font-bold flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Data Integrity & CHECK Constraints Validator</span>
                </div>
                <p className="text-slate-400 text-xs">
                  Test candidate video parameters to verify whether they satisfy database domain constraints (duration &gt; 0, retention 0-100%, valid foreign key).
                </p>
              </div>

              <form onSubmit={handleValidateForm} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Duration Seconds (chk_duration &gt; 0)</label>
                    <input
                      type="number"
                      value={valDuration}
                      onChange={(e) => setValDuration(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Retention % (chk_retention 0-100%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={valRetention}
                      onChange={(e) => setValRetention(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">CTR % (chk_ctr 0-100%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={valCtr}
                      onChange={(e) => setValCtr(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Channel ID (fk_videos_channel)</label>
                    <input
                      type="text"
                      value={valChannelId}
                      onChange={(e) => setValChannelId(e.target.value)}
                      placeholder="e.g. ashrides26_official (or type invalid id)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Audio Profile (Nullable Attribute)</label>
                    <input
                      type="text"
                      value={valAudioProfile}
                      onChange={(e) => setValAudioProfile(e.target.value)}
                      placeholder="Leave empty to test NULL handling"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition shadow flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Run Database Integrity Check</span>
                </button>
              </form>

              {/* Validation Result Output */}
              {valResult && (
                <div className={`p-4 rounded-xl border space-y-2 ${
                  valResult.valid 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {valResult.valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{valResult.valid ? '✓ Data Integrity Test PASSED: All Constraints Satisfied' : '✕ Data Integrity Test FAILED: Constraint Violation Detected'}</span>
                  </div>

                  {valResult.errors?.length > 0 && (
                    <div className="space-y-1 pt-1 text-rose-200">
                      {valResult.errors.map((err: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <span className="text-rose-400 font-bold">•</span>
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {valResult.warnings?.length > 0 && (
                    <div className="space-y-1 pt-1 text-amber-300">
                      {valResult.warnings.map((warn: string, i: number) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <span className="text-amber-400 font-bold">ℹ</span>
                          <span>{warn}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
