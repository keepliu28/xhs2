import React, { useState, useEffect, useRef } from 'react';
import { 
  Book, 
  Sparkles, 
  Trash2, 
  Zap, 
  Quote, 
  TrendingUp,
  Loader2,
  Library,
  Cpu,
  Box,
  CheckCircle,
  Clock,
  Layers,
  ShieldCheck,
  Download,
  Terminal,
  Plus,
  Settings,
  FolderOpen,
  Key,
  XCircle,
  AlertCircle
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import JSZip from 'jszip';
import { getTrendingBooks, generateBookContent, generateBookList } from './services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = [
  '#1A1A1A', '#2E3B2E', '#3D2B1F', '#2B3D41', '#4A4A4A', '#5C2D2D', '#2C3E50', '#1F3A3D'
];

interface BookProject {
  id: string;
  bookName: string;
  createdAt: number;
}

interface GeneratedContent {
  coverTitle: string;
  title: string;
  author: string;
  fullContent: string;
  quotes: string[];
  tags: string[];
  color: string;
  originalBook: string;
}

interface SlotStatus {
  name: string;
  status: 'waiting' | 'loading' | 'generating' | 'rendering' | 'done' | 'error';
  data?: GeneratedContent;
}

const IndustrialZenCard = ({ title, author, color, subtitle, type = 'main', innerRef, language = 'zh' }: { 
  title: string; 
  author?: string;
  color: string; 
  subtitle?: string; 
  type?: 'main' | 'quote';
  innerRef: any;
  language?: 'zh' | 'en';
}) => {
  const len = title ? title.length : 0;
  let fontSize = '150px';
  
  if (type === 'main') {
    if (len <= 10) fontSize = '180px';
    else if (len <= 20) fontSize = '140px';
    else if (len <= 30) fontSize = '110px';
    else fontSize = '90px';
  } else {
    if (len <= 40) fontSize = '80px';
    else if (len <= 80) fontSize = '64px';
    else fontSize = '52px';
  }

  const resonanceText = language === 'zh' ? '共 鸣 之 响 · RESONANCE' : 'RESONANCE · ECHO OF SOUL';
  const monologueText = language === 'zh' ? '— 灵 魂 独 白 —' : '— SOUL MONOLOGUE —';

  const renderFormattedText = (text: string, style: React.CSSProperties) => {
    if (!text) return null;
    const paragraphs = text.split('\n').filter(p => p.trim());
    return (
      <div style={{ ...style, display: 'block', whiteSpace: 'pre-wrap' }}>
        {paragraphs.map((p, i) => (
          <div key={i} style={{ 
            textIndent: '1em',
            marginBottom: i === paragraphs.length - 1 ? 0 : '0.8em',
            textAlign: style.textAlign as any || 'justify'
          }}>
            {p.trim()}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div 
      ref={innerRef} 
      style={{ 
        width: '1242px', 
        height: '1656px', 
        backgroundColor: '#FAF9F6', 
        border: `48px solid ${color}`, 
        boxSizing: 'border-box', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative', 
        fontFamily: '"Noto Serif SC", serif', 
        overflow: 'hidden' 
      }}
    >
      {type === 'main' ? (
        <div style={{ display: 'flex', height: '100%', width: '100%' }}>
          {/* Left Side: Book Visual */}
          <div style={{ 
            width: '45%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '80px',
            boxSizing: 'border-box',
            backgroundColor: `${color}08`
          }}>
            <div style={{ 
              width: '100%', 
              aspectRatio: '3/4', 
              backgroundColor: color, 
              borderRadius: '12px 24px 24px 12px', 
              boxShadow: `
                20px 20px 60px rgba(0,0,0,0.15),
                40px 40px 100px rgba(0,0,0,0.1),
                0px 0px 40px ${color}40
              `,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '60px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
              borderLeft: '12px solid rgba(0,0,0,0.1)'
            }}>
               <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '60%', height: '60%', backgroundColor: 'white', opacity: 0.1, borderRadius: '50%' }}></div>
               <div style={{ fontSize: '32px', fontWeight: 900, opacity: 0.8, marginBottom: '20px', letterSpacing: '0.1em' }}>{author}</div>
               <div style={{ fontSize: '64px', fontWeight: 900, lineHeight: 1.1 }}>《{subtitle}》</div>
            </div>
          </div>

          {/* Right Side: Impactful Text */}
          <div style={{ 
            width: '55%', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            padding: '0 80px 0 40px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
              <div style={{ 
                backgroundColor: color, 
                color: 'white', 
                padding: '8px 24px', 
                borderRadius: '12px', 
                fontSize: '28px', 
                fontWeight: 900,
                letterSpacing: '0.1em'
              }}>
                {language === 'zh' ? '必读书单' : 'MUST READ'}
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 900, 
                color, 
                opacity: 0.4, 
                letterSpacing: '0.3em'
              }}>
                {resonanceText.split('·')[0]}
              </div>
            </div>
            <h1 style={{ 
              color: '#121212', 
              fontSize, 
              fontWeight: 900, 
              lineHeight: 1.1, 
              letterSpacing: '-0.04em',
              wordBreak: 'break-all'
            }}>
              {title}
            </h1>
            <div style={{ 
              marginTop: '80px', 
              width: '120px', 
              height: '12px', 
              backgroundColor: color,
              borderRadius: '6px'
            }}></div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ 
            position: 'absolute', 
            top: '160px', 
            left: '0', 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '24px', 
            opacity: 0.3, 
            textTransform: 'uppercase', 
            letterSpacing: '0.6em', 
            fontSize: '32px', 
            fontWeight: 900, 
            color 
          }}>
            <Layers size={42} /><span>{resonanceText}</span>
          </div>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            textAlign: 'center', 
            padding: '0 120px', 
            boxSizing: 'border-box' 
          }}>
            <div style={{ color, opacity: 0.15, marginBottom: '100px' }}><Quote size={160} /></div>
            {renderFormattedText(title, { 
              color, 
              fontSize, 
              fontWeight: 700, 
              lineHeight: 1.7, 
              textAlign: 'justify', 
              maxWidth: '1000px' 
            })}
            <div style={{ marginTop: '120px', color, fontSize: '32px', fontWeight: 900, letterSpacing: '1.5em', opacity: 0.3 }}>{monologueText}</div>
          </div>
        </>
      )}
    </div>
  );
};

const TRANSLATIONS = {
  zh: {
    factory: '爆款产线',
    priorityBook: '优先目标书籍',
    placeholder: '输入书名或留空...',
    assets: '资产档案',
    notes: '已生成的灵魂笔记',
    trigger: '激发爆款灵感',
    monitor: '顺位生产监控',
    active: '产线活跃中',
    standby: '产线待命。',
    slot: '任务槽',
    idle: '空闲',
    trendAnalysis: '趋势分析中...',
    contentGen: '灵魂文案生成中...',
    rendering: '高精视觉渲染中...',
    done: '已完成并归档',
    statusFeedback: '状态反馈',
    library: '数字资产库',
    archiveLocked: '资产已锁定',
    noData: '暂无数据记录。',
    collecting: '正在采集感性瞬间...',
    packaging: '正在进行最终封装...',
    ready: '产出包已就绪，请检查下载。',
    error: '系统过载，请重试。',
    trendDiscovery: '正在探测全网爆款趋势...',
    genComplete: '文案生成完毕，准备视觉渲染...',
    genError: '文案引擎生成异常',
    cover: '封面',
    quote: '摘录',
    viralCopy: '爆款文案',
    recordedAt: '生成的感性书评 - 记录于',
    zipName: '爆款书单产出包',
    modeLabel: '生成模式',
    modeSingle: '单本深度',
    modeList: '主题书单',
    topicPlaceholder: '输入话题（如：成长赚钱）...',
    settings: '产线配置',
    apiKeyLabel: '自定义 API Key (可选)',
    apiKeyPlaceholder: '输入您的 Gemini API Key...',
    batchCountLabel: '单次并发数量',
    totalTargetLabel: '本次计划总产出量',
    intervalLabel: '笔记生成间隔 (秒)',
    selectDir: '选择本地保存路径',
    dirSelected: '已连接本地路径',
    reconnectDir: '重新激活路径授权',
    clearKey: '清除 Key',
    saveKey: '保存 Key',
    stop: '停止生产',
    progress: '生产进度',
    permissionDenied: '本地路径授权被拒绝',
    noHandle: '未选择本地路径',
    serverPathLabel: '服务器保存路径 (本地部署推荐)',
    serverPathPlaceholder: '例如: C:\\Users\\Name\\Desktop\\Notes',
    serverPathDesc: '在预览环境(Iframe)中，浏览器禁止直接访问本地文件夹。如果您是在本地运行此应用，请输入一个绝对路径，系统将直接由后端保存文件。',
    iframeWarning: '注意：由于浏览器安全限制，在预览模式下无法直接选择本地文件夹。请下载 ZIP 包，或在本地部署后使用“服务器保存路径”功能。',
    verifyPath: '验证路径',
    pathValid: '路径有效',
    pathInvalid: '路径无效或不可写',
    waitingForOthers: '等待其他线程完成...',
    searching: '正在寻找新书单...',
    noMoreBooks: '暂无新书，重试中...',
    logs: '系统日志',
    exportLogs: '导出日志',
    clearLogs: '清空日志',
    logDesc: '生产诊断与反馈',
    noLogs: '暂无日志记录。',
    reloadWarning: '注意：请勿选择项目根目录，否则文件变动会导致页面刷新。'
  },
  en: {
    factory: 'Viral Factory',
    priorityBook: 'Priority Target Book',
    placeholder: 'Enter title or leave blank...',
    assets: 'Asset Archive',
    notes: 'Soul Notes Generated',
    trigger: 'Trigger Inspiration',
    monitor: 'Production Monitor',
    active: 'SYSTEM ACTIVE',
    standby: 'System Standby.',
    slot: 'Task Slot',
    idle: 'Idle',
    trendAnalysis: 'Analyzing Trends...',
    contentGen: 'Generating Soul Copy...',
    rendering: 'High-Def Rendering...',
    done: 'Completed & Archived',
    statusFeedback: 'Status Feedback',
    library: 'Digital Library',
    archiveLocked: 'Archive Locked',
    noData: 'No data records found.',
    collecting: 'Capturing emotional moments...',
    packaging: 'Final packaging in progress...',
    ready: 'Package ready for download.',
    error: 'System overload, please retry.',
    trendDiscovery: 'Discovering viral trends...',
    genComplete: 'Copy generated, starting render...',
    genError: 'Content engine error',
    cover: 'Cover',
    quote: 'Quote',
    viralCopy: 'Viral_Copy',
    recordedAt: 'Soulful review generated at',
    zipName: 'Viral_Book_Package',
    modeLabel: 'Mode',
    modeSingle: 'Single Book',
    modeList: 'Book List',
    topicPlaceholder: 'Enter topic (e.g., Wealth Growth)...',
    settings: 'Production Settings',
    apiKeyLabel: 'Custom API Key (Optional)',
    apiKeyPlaceholder: 'Enter your Gemini API Key...',
    batchCountLabel: 'Concurrent Batch Size',
    totalTargetLabel: 'Total Target Count',
    intervalLabel: 'Interval Delay (Seconds)',
    selectDir: 'Select Local Output Path',
    dirSelected: 'Local Path Connected',
    reconnectDir: 'Re-activate Path',
    clearKey: 'Clear Key',
    saveKey: 'Save Key',
    stop: 'Stop Production',
    progress: 'Production Progress',
    permissionDenied: 'Local path permission denied',
    noHandle: 'No local path selected',
    serverPathLabel: 'Server Output Path (Recommended for Local)',
    serverPathPlaceholder: 'e.g., /Users/name/Desktop/Notes',
    serverPathDesc: 'In preview mode (Iframe), browsers block direct folder access. If running locally, enter an absolute path for direct backend saving.',
    iframeWarning: 'Note: Browser security blocks folder picking in preview mode. Please use ZIP download or local deployment with "Server Output Path".',
    verifyPath: 'Verify Path',
    pathValid: 'Path Valid',
    pathInvalid: 'Path Invalid or Not Writable',
    waitingForOthers: 'Waiting for others...',
    searching: 'Searching for books...',
    noMoreBooks: 'No more books, retrying...',
    logs: 'System Logs',
    exportLogs: 'Export Logs',
    clearLogs: 'Clear',
    logDesc: 'Production Diagnostics & Feedback',
    noLogs: 'No logs captured yet.',
    reloadWarning: 'Note: Do not select the project root directory, as file changes will trigger a page reload.'
  }
};

// IndexedDB Utility for Directory Handle Persistence
const DB_NAME = 'ResonanceDB';
const STORE_NAME = 'Handles';
const HANDLE_KEY = 'directoryHandle';

const saveHandleToDB = async (handle: any) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
      tx.oncomplete = () => resolve(true);
    };
    request.onerror = () => reject(request.error);
  });
};

const loadHandleFromDB = async () => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const getReq = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
      getReq.onsuccess = () => resolve(getReq.result);
    };
    request.onerror = () => reject(request.error);
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'generator' | 'library' | 'settings' | 'logs'>('generator');
  const [logs, setLogs] = useState<{ time: string, level: 'info' | 'warn' | 'error', msg: string, data?: any }[]>([]);

  // Intercept console logs for debug logging
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const handleLog = (level: 'info' | 'warn' | 'error', args: any[]) => {
      const time = new Date().toLocaleTimeString();
      let msg = '';
      let data: any = undefined;

      if (args.length > 0) {
        if (typeof args[0] === 'string') {
          msg = args[0];
          if (args.length > 1) {
            data = args.slice(1);
            if (data.length === 1) data = data[0];
          }
        } else {
          try {
            msg = typeof args[0] === 'object' ? JSON.stringify(args[0]) : String(args[0]);
          } catch (e) {
            msg = '[Circular/Unserializable]';
          }
          data = args;
          if (data.length === 1) data = data[0];
        }
      }

      setLogs(prev => [{ time, level, msg, data }, ...prev].slice(0, 500));
    };

    console.log = (...args) => {
      originalLog(...args);
      handleLog('info', args);
    };
    console.warn = (...args) => {
      originalWarn(...args);
      handleLog('warn', args);
    };
    console.error = (...args) => {
      originalError(...args);
      handleLog('error', args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const addLog = (level: 'info' | 'warn' | 'error', msg: string, data?: any) => {
    if (level === 'error') console.error(msg, data || '');
    else if (level === 'warn') console.warn(msg, data || '');
    else console.log(msg, data || '');
  };
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [generatorMode, setGeneratorMode] = useState<'single' | 'list'>('single');
  const [bookNameInput, setBookNameInput] = useState('');
  const [projects, setProjects] = useState<BookProject[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [slotStatus, setSlotStatus] = useState<SlotStatus[]>([]);
  const [exportProgress, setExportProgress] = useState("");
  
  const mainCoverRefs = useRef<(HTMLDivElement | null)[]>([]);
  const quoteRefsArray = useRef<(HTMLDivElement | null)[][]>([]);
  
  // New Settings State
  const [apiKey, setApiKey] = useState(localStorage.getItem('resonance_api_key') || '');
  const [batchCount, setBatchCount] = useState(Number(localStorage.getItem('resonance_batch_count')) || 2);
  const [totalTargetCount, setTotalTargetCount] = useState(Number(localStorage.getItem('resonance_total_target')) || 10);
  const [intervalDelay, setIntervalDelay] = useState(Number(localStorage.getItem('resonance_interval_delay')) || 5);
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [serverOutputPath, setServerOutputPath] = useState(localStorage.getItem('resonance_server_path') || '');
  const [isPathValid, setIsPathValid] = useState<boolean | null>(null);
  const [hasSavedHandle, setHasSavedHandle] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const stopSignal = useRef(false);
  const processingTitlesRef = useRef<Set<string>>(new Set());

  const isIframe = window.self !== window.top;

  const t = TRANSLATIONS[language];

  const mainCoverRef = useRef<HTMLDivElement>(null);
  const quoteRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Load directory handle on mount
    loadHandleFromDB().then(async (handle: any) => {
      if (handle) {
        setHasSavedHandle(true);
      }
    });

    // Fetch projects
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => {
        console.error("Failed to fetch projects", err);
        const saved = localStorage.getItem('resonance_projects');
        if (saved) setProjects(JSON.parse(saved));
      });

    // Fetch config from server - Source of truth for server path
    fetch('/api/config')
      .then(res => res.json())
      .then(async (data) => {
        console.log("[Config] Loaded from server:", data);
        if (data && data.serverOutputPath) {
          setServerOutputPath(data.serverOutputPath);
          setIsPathValid(true);
          localStorage.setItem('resonance_server_path', data.serverOutputPath);
        } else {
          // Fallback to local storage if server has no config yet
          const localPath = localStorage.getItem('resonance_server_path');
          if (localPath) {
            console.log("[Config] No server config, using local storage path:", localPath);
            setServerOutputPath(localPath);
            // Attempt to auto-verify local path on server
            try {
              const vRes = await fetch('/api/verify-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ outputPath: localPath })
              });
              const vData = await vRes.json();
              if (vData && vData.exists) {
                setIsPathValid(true);
                // Sync to server config ONLY if it's valid
                fetch('/api/config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ serverOutputPath: localPath })
                });
              }
            } catch (e) {
              console.error("[Config] Auto-verify failed", e);
            }
          }
        }
      })
      .catch(err => console.error("Failed to fetch config", err));
  }, []);

  const saveProjects = async (newProjects: BookProject[]) => {
    setProjects(newProjects);
    localStorage.setItem('resonance_projects', JSON.stringify(newProjects));
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProjects)
      });
    } catch (err) {
      console.error("Failed to save projects to server", err);
    }
  };

  const addProject = async (newProject: BookProject) => {
    // Update local state immediately
    setProjects(prev => [newProject, ...prev]);
    
    // Update localStorage
    const saved = localStorage.getItem('resonance_projects');
    const projects = saved ? JSON.parse(saved) : [];
    projects.unshift(newProject);
    localStorage.setItem('resonance_projects', JSON.stringify(projects));

    // Update server
    try {
      await fetch('/api/projects/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
    } catch (err) {
      console.error("Failed to add project to server", err);
    }
  };

  useEffect(() => {
    // Initialize slots based on batch count
    const initialSlots = Array.from({ length: batchCount }, () => ({ name: '-', status: 'waiting' as const }));
    setSlotStatus(initialSlots);
  }, [batchCount]);

  const handleSelectDirectory = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      setDirectoryHandle(handle);
      setHasSavedHandle(true);
      await saveHandleToDB(handle);
    } catch (err: any) {
      console.error("Directory picker cancelled or failed", err);
      if (err?.name === 'SecurityError' || err?.message?.includes('iframe')) {
        alert("Browser security blocks folder picking in preview mode. Please use Server Output Path or ZIP download.");
      }
    }
  };

  const handleReconnectDirectory = async () => {
    try {
      const handle = await loadHandleFromDB();
      if (handle) {
        const options = { mode: 'readwrite' };
        if (await (handle as any).requestPermission(options) === 'granted') {
          setDirectoryHandle(handle);
          setHasSavedHandle(true);
        } else {
          alert(t.permissionDenied);
        }
      }
    } catch (err) {
      console.error("Failed to reconnect directory", err);
    }
  };

  const verifyServerPath = async (e?: React.MouseEvent): Promise<boolean> => {
    if (e) e.preventDefault();
    if (!serverOutputPath) return false;
    try {
      addLog('info', 'Verifying server path', { path: serverOutputPath });
      const res = await fetch('/api/verify-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputPath: serverOutputPath })
      });
      const data = await res.json();
      setIsPathValid(data.exists);
      if (data.exists) {
        localStorage.setItem('resonance_server_path', serverOutputPath);
        // Persist to server config
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serverOutputPath })
        });
        addLog('info', 'Server path verified and saved', { path: serverOutputPath });
        return true;
      } else {
        addLog('warn', 'Server path verification failed', { path: serverOutputPath, error: data.error });
        return false;
      }
    } catch (err: any) {
      addLog('error', 'Path verification error', { error: err.message || err });
      setIsPathValid(false);
      return false;
    }
  };

  const updateSlot = (index: number, data: Partial<SlotStatus>) => {
    setSlotStatus(prev => {
      const newSlots = [...prev];
      if (newSlots[index]) {
        newSlots[index] = { ...newSlots[index], ...data };
      }
      return newSlots;
    });
  };

  const yieldToUI = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

  const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
    ]);
  };

  const handleProductionFlow = async () => {
    if (isProcessing) return;

    // 0. Pre-start validation
    // If directoryHandle is set, we skip server path validation because we prioritize local handle.
    if (!directoryHandle && serverOutputPath) {
      if (isPathValid === false) {
        alert("Server path is invalid. Please verify it in settings.");
        return;
      }
      if (isPathValid === null) {
        // Try to verify now
        const isValid = await verifyServerPath();
        if (!isValid) {
          alert("Server path could not be verified. Please check settings.");
          return;
        }
      }
    } else if (!directoryHandle && !hasSavedHandle && !serverOutputPath) {
      alert("No saving method selected. Please select a local directory or set a server path in settings.");
      return;
    }

    // 1. Determine the saving mode priority
    // If directoryHandle is explicitly set (user selected it), we prioritize it.
    // Otherwise, if serverOutputPath is set and valid, we use it.
    let currentHandle = directoryHandle;
    
    if (!currentHandle && hasSavedHandle) {
      try {
        const savedHandle = await loadHandleFromDB();
        if (savedHandle) {
          const options = { mode: 'readwrite' };
          const status = await (savedHandle as any).queryPermission(options);
          if (status === 'granted') {
            currentHandle = savedHandle;
            setDirectoryHandle(savedHandle);
          } else {
            // Only request if the user is NOT using server path
            if (!serverOutputPath) {
              if (await (savedHandle as any).requestPermission(options) === 'granted') {
                currentHandle = savedHandle;
                setDirectoryHandle(savedHandle);
              } else {
                alert("Permission denied for local directory. Please grant permission or use server path.");
                return;
              }
            }
          }
        }
      } catch (err) {
        console.error("Auto-reconnect failed", err);
        // If reconnect fails, and we don't have server path, we must stop
        if (!serverOutputPath) {
          alert("Failed to reconnect to local directory. Please re-select it.");
          return;
        }
      }
    }

    if (!serverOutputPath && !currentHandle) {
      alert("No valid saving method found. Please configure settings.");
      return;
    }

    addLog('info', 'Starting production flow', { totalTargetCount, batchCount, serverOutputPath, generatorMode });
    setIsProcessing(true);
    setIsStopping(false);
    stopSignal.current = false;
    processingTitlesRef.current.clear();

    if (generatorMode === 'list') {
      try {
        const topic = bookNameInput.trim() || (language === 'zh' ? '成长赚钱' : 'Wealth Growth');
        setExportProgress(t.trendDiscovery);
        const listData = await withTimeout(
          generateBookList(topic, language, apiKey),
          60000,
          "List generation timed out"
        );
        
        addLog('info', 'Book list generated', { count: listData.books?.length || 0, coverTitle: listData.coverTitle });
        
        if (!listData.books || !Array.isArray(listData.books)) {
          throw new Error("Invalid book list format received from AI");
        }

        setTotalTargetCount(listData.books.length + 1); // +1 for the main cover
        
        // 1. Generate Main Cover for the list
        const mainCoverData: GeneratedContent = {
          coverTitle: listData.coverTitle || topic,
          title: listData.coverTitle || topic,
          author: 'RESONANCE',
          fullContent: listData.coverTitle || topic,
          quotes: [],
          tags: listData.tags || [topic, language === 'zh' ? '书单' : 'BookList'],
          color: listData.books[0]?.color || '#121212',
          originalBook: topic
        };
        
        updateSlot(0, { name: t.cover, status: 'rendering', data: mainCoverData });
        await yieldToUI(1500);
        await handleSinglePackaging(mainCoverData, 0, currentHandle);
        setCompletedCount(1);
        await yieldToUI(1000);

        // 2. Generate individual book covers
        for (let i = 0; i < listData.books.length; i++) {
          if (stopSignal.current) break;
          const book = listData.books[i];
          const data: GeneratedContent = {
            coverTitle: `${i + 1}. ${book.description}`,
            title: book.description,
            author: book.author,
            fullContent: book.description,
            quotes: [],
            tags: listData.tags || [topic, language === 'zh' ? '书单' : 'BookList'],
            color: book.color,
            originalBook: book.title
          };
          
          updateSlot(0, { name: book.title, status: 'rendering', data });
          await yieldToUI(1000);
          await handleSinglePackaging(data, 0, currentHandle);
          updateSlot(0, { status: 'done' });
          setCompletedCount(i + 2);
          await yieldToUI(2000);
        }
        setExportProgress(t.ready);
      } catch (e: any) {
        console.error("List production error:", e);
        addLog('error', 'List production failed', e.message || e);
        setExportProgress(t.error);
        alert(`Production Failed: ${e.message || "Unknown error"}`);
      } finally {
        setIsProcessing(false);
      }
      return;
    }
    
    // Ensure server path is persisted if we're using it
    if (serverOutputPath && isPathValid) {
      localStorage.setItem('resonance_server_path', serverOutputPath);
      try {
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serverOutputPath })
        });
        addLog('info', 'Server path synced to backend', { serverOutputPath });
      } catch (e) {
        addLog('error', 'Failed to sync server path config', e);
      }
    }

    const startedCountRef = { current: 0 };
    const completedCountRef = { current: 0 };
    setCompletedCount(0);
    
    const archivedTitles = new Set(projects.map(p => p.bookName));
    let pendingQueue: string[] = [];
    if (bookNameInput.trim()) {
      pendingQueue.push(bookNameInput.trim());
    }

    let isReplenishing = false;
    let replenishRetryCount = 0;

    // Worker function for a single slot
    const replenishQueue = async () => {
      if (isReplenishing || stopSignal.current) return;
      if (pendingQueue.length < batchCount) {
        isReplenishing = true;
        addLog('info', 'Replenishing queue: fetching trending books');
        setExportProgress(t.trendDiscovery);
        try {
          const excludeList = Array.from(archivedTitles);
          // Add 30s timeout for trending books fetch
          const trends = await withTimeout(
            getTrendingBooks(language, apiKey, excludeList),
            30000,
            "Trending books fetch timed out"
          );
          
          addLog('info', 'Trending books received', { count: trends.length });
          const availableTrends = trends.filter((tr: any) => 
            tr && tr.title && 
            !archivedTitles.has(tr.title) && 
            !pendingQueue.includes(tr.title) &&
            !processingTitlesRef.current.has(tr.title) // Filter out titles currently being processed
          );
          
          if (availableTrends.length > 0) {
            addLog('info', 'Adding new books to pending queue', { count: availableTrends.length });
            pendingQueue.push(...availableTrends.map(t => t.title));
            replenishRetryCount = 0;
          } else {
            addLog('warn', 'No new books found in latest trend list');
            replenishRetryCount++;
          }
        } catch (e: any) { 
          addLog('error', 'Replenish Queue Error', { error: e.message || e }); 
          replenishRetryCount++;
        } finally {
          isReplenishing = false;
        }
      }
    };

    // Initialize slots
    setSlotStatus(Array.from({ length: batchCount }, () => ({ name: '-', status: 'waiting' })));

    // Worker function for a single slot
    const runWorker = async (slotIdx: number) => {
      console.log(`Worker ${slotIdx} started`);
      
      try {
        // Initial jitter to desynchronize workers
        await yieldToUI(Math.random() * 3000);

        while (!stopSignal.current) {
          let target: string | undefined;
          
          try {
            // 1. Check if we've reached the target
            if (completedCountRef.current >= totalTargetCount) {
              console.log(`Worker ${slotIdx} reached target, exiting`);
              break;
            }
            
            // 2. If we've started enough tasks, wait for them to finish
            if (startedCountRef.current >= totalTargetCount) {
              updateSlot(slotIdx, { status: 'waiting', name: t.waitingForOthers || 'Waiting for others...' });
              await yieldToUI(3000);
              continue;
            }
            
            // 3. Ensure we have targets
            if (pendingQueue.length === 0) {
              updateSlot(slotIdx, { status: 'loading', name: t.searching || 'Searching...' });
              
              // Add jitter before replenishing to avoid stampede
              await yieldToUI(Math.random() * 1000);
              
              await replenishQueue();
              
              if (pendingQueue.length === 0) {
                // If we've tried many times and still no books, just wait longer
                if (replenishRetryCount > 5) {
                  updateSlot(slotIdx, { status: 'waiting', name: t.noMoreBooks || 'No more books found, retrying...' });
                  await yieldToUI(10000); // Wait 10s before trying to replenish again
                } else {
                  await yieldToUI(3000);
                }
                continue;
              }
            }
            
            // Double-check start count before claiming to avoid race condition
            if (startedCountRef.current >= totalTargetCount) {
              updateSlot(slotIdx, { status: 'waiting', name: t.waitingForOthers || 'Waiting for others...' });
              await yieldToUI(3000);
              continue;
            }
            
            const nextTarget = pendingQueue.shift();
            if (!nextTarget) {
               await yieldToUI(1000);
               continue;
            }
            target = nextTarget;

            // 4. Successfully claimed a target
            processingTitlesRef.current.add(target); // Lock the title immediately
            startedCountRef.current++;
            addLog('info', `Worker ${slotIdx} claimed task: ${target}`, { startedCount: startedCountRef.current });
            updateSlot(slotIdx, { name: target, status: 'loading', data: undefined });
            
            // 4. Generate Content
            addLog('info', `Worker ${slotIdx} generating content for: ${target}`);
            updateSlot(slotIdx, { status: 'generating' });
            
            // Add jitter before API call to avoid rate limits
            await yieldToUI(Math.random() * 2000 + 500);
            
            // Add 120s timeout for content generation
            const content = await withTimeout(
              generateBookContent(target, language, apiKey),
              120000,
              "Content generation timed out"
            );
            
            addLog('info', `Worker ${slotIdx} content generated`, { target, title: content.title });
            const data = { ...content, originalBook: target };
            
            if (stopSignal.current) {
              processingTitlesRef.current.delete(target);
              break;
            }

            // 5. Render & Save (Immediate)
            addLog('info', `Worker ${slotIdx} rendering & saving: ${target}`);
            updateSlot(slotIdx, { status: 'rendering', data });
            
            // Add 60s timeout for packaging/saving
            await withTimeout(
              handleSinglePackaging(data, slotIdx, currentHandle),
              60000,
              "File saving timed out"
            );
            
            if (stopSignal.current) {
              processingTitlesRef.current.delete(target);
              break;
            }

            // 6. Mark as Done
            completedCountRef.current++;
            setCompletedCount(completedCountRef.current);
            archivedTitles.add(target); // Update local archive to avoid duplicates
            processingTitlesRef.current.delete(target); // Task finished, remove from processing
            addLog('info', `Worker ${slotIdx} completed task: ${target}`, { completedCount: completedCountRef.current });
            updateSlot(slotIdx, { status: 'done' });
            
            if (completedCountRef.current >= totalTargetCount) {
              console.log(`Worker ${slotIdx} finished last task, exiting`);
            }

            // 7. Wait before next task
            await yieldToUI(3000);
            updateSlot(slotIdx, { status: 'waiting', name: '-' });
            
          } catch (e: any) {
            // This catch block handles errors for a specific task
            const errorMsg = e.message || String(e);
            addLog('error', `Worker ${slotIdx} failed processing ${target || 'unknown'}`, { error: errorMsg });
            updateSlot(slotIdx, { status: 'error' });
            
            if (target) {
              processingTitlesRef.current.delete(target); // Task failed, remove from processing
              // If failed, we "un-claim" the started count so another worker can try to reach the target
              // Only decrement if we actually incremented (which happens right after claiming target)
              startedCountRef.current--; 
            }
            
            await yieldToUI(5000); // Wait longer on error
          }
        }
      } catch (fatalErr) {
        console.error(`Worker ${slotIdx} crashed fatally`, fatalErr);
        addLog('error', `Worker ${slotIdx} crashed fatally`, { error: String(fatalErr) });
        updateSlot(slotIdx, { status: 'error', name: 'Crashed' });
      }
      console.log(`Worker ${slotIdx} stopped`);
    };

    // Start all workers in parallel, ensuring no rejection stops the group
    await Promise.all(Array.from({ length: batchCount }, (_, i) => runWorker(i).catch(e => console.error(`Worker ${i} promise rejected`, e))));

    setIsProcessing(false);
    setIsStopping(false);
    setExportProgress(stopSignal.current ? t.stop : t.ready);
  };

  const handleSinglePackaging = async (book: GeneratedContent, slotIdx: number, activeHandle?: any) => {
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
    const fullTS = `${dateStr}_${timeStr}`;
    const timeFull = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;

    try {
      await document.fonts.ready;
      const exportOptions = { pixelRatio: 2, backgroundColor: '#FAF9F6', width: 1242, height: 1656 };

      // Wait for card to be in DOM and styles to compute
      await yieldToUI(2000);

      if (stopSignal.current) return;

      const sanitizedBookName = book.originalBook.replace(/[<>:"/\\|?*]/g, '_');
      const folderName = `${fullTS}_${sanitizedBookName}`;
      // const serverFiles is removed, we save immediately
      let bookFolder: any = null;
      let noteZip: JSZip | null = null;
      
      // Priority: 1. Local Directory Handle (if active), 2. Server Path, 3. ZIP Fallback
      const useLocalHandle = !!(activeHandle || directoryHandle);
      const useServerPath = !useLocalHandle && !!serverOutputPath;
      const useZip = !useLocalHandle && !useServerPath;

      if (useLocalHandle) {
        const effectiveHandle = activeHandle || directoryHandle;
        try {
          bookFolder = await effectiveHandle.getDirectoryHandle(folderName, { create: true });
        } catch (e) {
          console.warn("Directory handle failed, falling back to ZIP", e);
          noteZip = new JSZip();
        }
      } else if (useServerPath) {
        // Server path is active, we don't need bookFolder or noteZip
        console.log(`[Save] Using Server Path for ${book.originalBook}`);
      } else {
        noteZip = new JSZip();
      }
      
      // Helper to save a file based on the active mode
      const saveFile = async (fileName: string, content: string | Blob, isBase64Image: boolean) => {
        if (useLocalHandle && bookFolder?.getFileHandle) {
          try {
            const fileHandle = await bookFolder.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            if (isBase64Image && typeof content === 'string') {
              const blob = await (await fetch(`data:image/png;base64,${content}`)).blob();
              await writable.write(blob);
            } else {
              await writable.write(content);
            }
            await writable.close();
          } catch (e) {
            console.error(`Failed to save ${fileName} locally:`, e);
            throw e;
          }
        } else if (useServerPath) {
          // Save immediately to server
          const fileData = { 
            name: fileName, 
            content: content as string, 
            type: isBase64Image ? 'image' : 'text' 
          };
          
          try {
            const res = await fetch('/api/save-assets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ outputPath: serverOutputPath, folderName, files: [fileData] })
            });
            if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(`Server save failed: ${errData.error || res.statusText}`);
            }
          } catch (e) {
            console.error(`Failed to save ${fileName} to server:`, e);
            throw e;
          }
        } else if (noteZip) {
          noteZip.file(fileName, content as string, { base64: isBase64Image });
        }
      };
      
      // 1. Render Cover
      const coverRef = mainCoverRefs.current[slotIdx];
      if (coverRef) {
        let coverImg: string | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            console.log(`[Render] Starting cover render for ${book.originalBook} (Slot ${slotIdx}, Attempt ${attempt + 1})`);
            coverImg = await Promise.race([
              htmlToImage.toPng(coverRef, { ...exportOptions, cacheBust: true }),
              new Promise<string>((_, reject) => setTimeout(() => reject(new Error("Render Timeout")), 30000))
            ]);
            if (coverImg) break;
          } catch (renderErr) {
            console.error(`[Render] Cover attempt ${attempt + 1} failed for ${book.originalBook}:`, renderErr);
            if (attempt < 2) await yieldToUI(1000);
          }
        }
        
        if (coverImg && coverImg.includes(',')) {
          const fileName = `01_${t.cover}_${timeStr}_${sanitizedBookName}.png`;
          const base64Data = coverImg.split(',')[1];
          await saveFile(fileName, base64Data, true);
          console.log(`[Render] Cover render success for ${book.originalBook}`);
        }
      }

      // 2. Render Quotes
      const qts = book.quotes || [];
      const quoteRefs = quoteRefsArray.current[slotIdx] || [];
      for (let i = 0; i < qts.length; i++) {
        if (stopSignal.current) break;
        const ref = quoteRefs[i];
        if (ref) {
          let qImg: string | null = null;
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              console.log(`[Render] Starting quote ${i} render for ${book.originalBook} (Attempt ${attempt + 1})`);
              qImg = await Promise.race([
                htmlToImage.toPng(ref, { ...exportOptions, cacheBust: true }),
                new Promise<string>((_, reject) => setTimeout(() => reject(new Error("Render Timeout")), 20000))
              ]);
              if (qImg) break;
            } catch (renderErr) {
              console.error(`[Render] Quote ${i} attempt ${attempt + 1} failed for ${book.originalBook}:`, renderErr);
              if (attempt < 1) await yieldToUI(1000);
            }
          }

          if (qImg && qImg.includes(',')) {
            const fileName = `0${i + 2}_${t.quote}_${timeStr}_${i + 1}.png`;
            const base64Data = qImg.split(',')[1];
            await saveFile(fileName, base64Data, true);
            console.log(`[Render] Quote ${i} render success for ${book.originalBook}`);
          }
          // Small delay between quotes to let browser breathe
          await yieldToUI(500);
        }
      }

      // 3. Save Markdown
      const mdContent = `# ${book.title}\n\n**Author**: ${book.author}\n\n${book.fullContent}\n\n---\n**Tags**: #${book.tags?.join(' #')}\n\n*${t.recordedAt} ${new Date().toLocaleString()}*`;
      const mdFileName = `${timeStr}_${sanitizedBookName}_${t.viralCopy}.md`;
      await saveFile(mdFileName, mdContent, false);
      
      // (Server batch save block removed - files are saved immediately above)

      // 4. Finalize ZIP if needed
      if (noteZip) {
        const content = await noteZip.generateAsync({ type: "blob" });
        const downloadUrl = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${folderName}.zip`;
        link.click();
        URL.revokeObjectURL(downloadUrl);
      }
      
      // 5. Archive
      const newProject: BookProject = {
        id: Math.random().toString(36).substr(2, 9),
        bookName: book.originalBook,
        createdAt: Date.now()
      };
      await addProject(newProject);

    } catch (err) {
      console.error(`Error processing ${book.originalBook}:`, err);
      throw err;
    }
  };

  const deleteProject = (id: string) => {
    saveProjects(projects.filter(p => p.id !== id));
  };

  return (
    <div className="h-screen bg-[#F3F2EE] text-[#2C2C2C] flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-24 bg-white border-b md:border-r border-[#E0DDD5] flex md:flex-col items-center py-6 md:py-10 space-x-12 md:space-x-0 md:space-y-12 z-30 shadow-sm">
        <div className="w-14 h-14 bg-[#121212] rounded-2xl flex items-center justify-center text-white shadow-xl">
          <Book size={28} />
        </div>
        <button 
          onClick={() => setActiveTab('generator')} 
          className={cn(
            "p-4 rounded-2xl transition-all",
            activeTab === 'generator' ? 'bg-[#121212] text-white' : 'text-gray-400 hover:text-[#121212]'
          )}
        >
          <Zap size={28} />
        </button>
        <button 
          onClick={() => setActiveTab('library')} 
          className={cn(
            "p-4 rounded-2xl transition-all",
            activeTab === 'library' ? 'bg-[#121212] text-white' : 'text-gray-400 hover:text-[#121212]'
          )}
        >
          <Library size={28} />
        </button>

        <button 
          onClick={() => setActiveTab('settings')} 
          className={cn(
            "p-4 rounded-2xl transition-all",
            activeTab === 'settings' ? 'bg-[#121212] text-white' : 'text-gray-400 hover:text-[#121212]'
          )}
        >
          <Settings size={28} />
        </button>
        
        <button 
          onClick={() => setActiveTab('logs')} 
          className={cn(
            "p-4 rounded-2xl transition-all",
            activeTab === 'logs' ? 'bg-[#121212] text-white' : 'text-gray-400 hover:text-[#121212]'
          )}
        >
          <Terminal size={28} />
        </button>
        
        <div className="flex-grow hidden md:block" />
        
        <button 
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          className="p-4 rounded-2xl text-gray-400 hover:text-[#121212] font-black text-sm transition-all"
        >
          {language.toUpperCase()}
        </button>
      </nav>

      <main className="flex-grow flex flex-col h-full overflow-hidden">
        {/* Hidden Rendering Area - Always in DOM for production */}
        <div style={{ 
          position: 'fixed', 
          left: '0', 
          top: '0', 
          width: '1242px', 
          height: '1656px', 
          overflow: 'hidden', 
          pointerEvents: 'none', 
          zIndex: -1000, 
          opacity: 0.01 
        }}>
          {slotStatus.map((slot, bIdx) => (
            slot.data && (
              <div key={`render-${bIdx}`}>
                <IndustrialZenCard 
                  innerRef={(el) => { mainCoverRefs.current[bIdx] = el; }} 
                  title={slot.data.coverTitle} 
                  author={slot.data.author}
                  color={slot.data.color} 
                  subtitle={slot.data.originalBook} 
                  type="main" 
                  language={language}
                />
                {(slot.data.quotes || []).map((q, qIdx) => (
                  <IndustrialZenCard 
                    key={`quote-${qIdx}`} 
                    innerRef={(el) => { 
                      if (!quoteRefsArray.current[bIdx]) quoteRefsArray.current[bIdx] = [];
                      quoteRefsArray.current[bIdx][qIdx] = el; 
                    }} 
                    title={q} 
                    color={slot.data.color} 
                    type="quote" 
                    language={language}
                  />
                ))}
              </div>
            )
          ))}
        </div>

        {activeTab === 'generator' && (
          <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Control Panel */}
            <div className="w-full md:w-[400px] bg-white p-8 overflow-y-auto border-r border-[#E0DDD5] flex flex-col z-20 shadow-2xl">
              <header className="mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-serif font-black tracking-tighter mb-2 bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                    {t.factory}
                  </h1>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest italic flex items-center gap-2">
                    <ShieldCheck size={12} className="text-green-500" /> GEMINI 3 FLASH
                  </p>
                </div>
                <button 
                  onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                  className="md:hidden p-2 rounded-xl bg-[#F7F6F2] text-[#121212] font-black text-xs"
                >
                  {language.toUpperCase()}
                </button>
              </header>
              
              <div className="space-y-8 flex-grow">
                <section>
                  <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] block mb-3">{t.modeLabel}</label>
                  <div className="flex bg-[#F7F6F2] p-1.5 rounded-2xl mb-6">
                    <button 
                      onClick={() => setGeneratorMode('single')}
                      className={cn(
                        "flex-1 py-3 rounded-xl font-black text-xs transition-all",
                        generatorMode === 'single' ? "bg-[#121212] text-white shadow-lg" : "text-gray-400"
                      )}
                    >
                      {t.modeSingle}
                    </button>
                    <button 
                      onClick={() => setGeneratorMode('list')}
                      className={cn(
                        "flex-1 py-3 rounded-xl font-black text-xs transition-all",
                        generatorMode === 'list' ? "bg-[#121212] text-white shadow-lg" : "text-gray-400"
                      )}
                    >
                      {t.modeList}
                    </button>
                  </div>

                  <label className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] block mb-3">
                    {generatorMode === 'single' ? t.priorityBook : '书单话题'}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={generatorMode === 'single' ? t.placeholder : t.topicPlaceholder} 
                      value={bookNameInput} 
                      onChange={(e) => setBookNameInput(e.target.value)} 
                      disabled={isProcessing}
                      className="w-full px-6 py-5 bg-[#F7F6F2] rounded-3xl font-bold text-lg outline-none border-2 border-transparent focus:border-[#121212] transition-all disabled:opacity-50" 
                    />
                    <Plus className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  </div>
                </section>
                
                <div className="bg-[#121212] text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={80} /></div>
                   <h4 className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-4">{t.assets}</h4>
                   <p className="text-4xl font-black mb-1">{projects.length}</p>
                   <p className="text-xs font-bold opacity-60">{t.notes}</p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                 <button 
                  onClick={isProcessing ? () => { stopSignal.current = true; setIsStopping(true); } : handleProductionFlow} 
                  className={cn(
                    "w-full py-7 rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all",
                    isProcessing ? (isStopping ? "bg-gray-500 text-white cursor-wait" : "bg-red-500 text-white") : "bg-[#121212] text-white"
                  )}
                  disabled={isStopping}
                 >
                   {isProcessing ? (
                     isStopping ? <><Loader2 size={24} className="animate-spin" /><span>{t.stop}...</span></> : <><XCircle size={24} /><span>{t.stop}</span></>
                   ) : <><Sparkles size={24} /><span>{t.trigger}</span></>}
                 </button>
                 
                 {isProcessing && (
                   <div className="bg-[#F7F6F2] p-6 rounded-3xl border border-[#E0DDD5]">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.progress}</span>
                         <span className="text-sm font-black text-[#121212]">{completedCount} / {totalTargetCount}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-[#121212] transition-all duration-500" 
                           style={{ width: `${(completedCount / totalTargetCount) * 100}%` }}
                         />
                      </div>
                   </div>
                 )}
              </div>
            </div>

            {/* Production Monitor */}
            <div className="flex-grow bg-[#F3F2EE] flex flex-col p-8 md:p-12 relative overflow-y-auto">
               <div className="max-w-4xl w-full mx-auto space-y-8">
                  <div className="flex justify-between items-center text-[#121212]">
                    <h2 className="text-2xl font-serif font-black tracking-tight flex items-center">
                      <Cpu size={28} className={cn("mr-3", isProcessing ? 'text-red-500 animate-spin' : 'text-gray-400')} />
                      {t.monitor}
                    </h2>
                    {isProcessing && <div className="text-[10px] font-black bg-red-500 text-white px-3 py-1.5 rounded-full animate-pulse">{t.active}</div>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {slotStatus.map((slot, i) => (
                       <div 
                        key={i} 
                        className={cn(
                          "bg-white p-8 rounded-[2.5rem] border-2 transition-all duration-500",
                          slot.status === 'done' ? 'border-green-500 shadow-md' : 
                          slot.status === 'waiting' ? 'border-[#E0DDD5] opacity-50' : 
                          'border-[#121212] shadow-2xl scale-[1.02]'
                        )}
                       >
                          <div className="flex justify-between items-start mb-6">
                             <div className="bg-[#F7F6F2] p-4 rounded-2xl">
                               <Box size={28} className={slot.status === 'waiting' ? 'text-gray-300' : 'text-[#121212]'} />
                             </div>
                             {slot.status === 'done' ? <CheckCircle className="text-green-500" size={32} /> : 
                              slot.status === 'error' ? <AlertCircle className="text-red-500" size={32} /> :
                              slot.status !== 'waiting' ? <Loader2 className="text-red-500 animate-spin" size={32} /> : null}
                          </div>
                          <div className="space-y-1">
                             <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t.slot} 0{i+1}</span>
                             <h3 className="text-xl font-serif font-black truncate">{slot.name}</h3>
                             <p className="text-xs font-bold text-gray-400">
                                {slot.status === 'waiting' ? t.idle : 
                                 slot.status === 'loading' ? t.trendAnalysis :
                                 slot.status === 'generating' ? t.contentGen :
                                 slot.status === 'rendering' ? t.rendering : t.done}
                             </p>
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-[#E0DDD5] flex items-center justify-between shadow-sm">
                     <div className="flex items-center space-x-6">
                        <div className="w-14 h-14 bg-[#F7F6F2] rounded-full flex items-center justify-center border border-[#E0DDD5]">
                          <Clock size={24} className="text-gray-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t.statusFeedback}</p>
                           <p className="text-lg font-black text-[#121212]">{exportProgress || t.standby}</p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Hidden Rendering Area removed from here */}
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="p-8 md:p-20 overflow-y-auto max-w-6xl mx-auto w-full">
             <header className="mb-12 border-b border-[#E0DDD5] pb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-serif font-black tracking-tighter text-[#121212]">{t.library}</h1>
                  <p className="text-gray-400 font-bold mt-2">Archive: local-resonance-cloud</p>
                </div>
                <div className="text-right flex items-center gap-3">
                   <div className="text-5xl font-black opacity-10">{projects.length}</div>
                   <div className="text-xs font-black uppercase tracking-tighter opacity-20 rotate-90">BOOKS</div>
                </div>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {projects.map(proj => (
                 <div key={proj.id} className="bg-white px-8 py-7 rounded-[2rem] border border-[#E0DDD5] shadow-sm flex items-center justify-between hover:border-[#121212] transition-all group hover:shadow-xl">
                    <div className="flex flex-col">
                      <span className="font-serif font-black text-xl text-[#121212]">《{proj.bookName}》</span>
                      <span className="text-[9px] font-black text-gray-300 uppercase mt-1">
                        {t.archiveLocked} · {new Date(proj.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      onClick={() => deleteProject(proj.id)} 
                      className="text-gray-200 group-hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 size={20} />
                    </button>
                 </div>
               ))}
               {projects.length === 0 && <div className="col-span-full py-20 text-center text-gray-300 font-bold italic">{t.noData}</div>}
             </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="p-8 md:p-20 overflow-hidden flex flex-col h-full max-w-6xl mx-auto w-full">
             <header className="mb-8 border-b border-[#E0DDD5] pb-8 flex justify-between items-end shrink-0">
                <div>
                  <h1 className="text-4xl font-serif font-black tracking-tighter text-[#121212]">{t.logs}</h1>
                  <p className="text-gray-400 font-bold mt-2">{t.logDesc}</p>
                </div>
                <div className="flex gap-4">
                   <button 
                     onClick={() => {
                       const logText = logs.map(l => `[${l.time}] [${l.level.toUpperCase()}] ${l.msg} ${l.data ? JSON.stringify(l.data) : ''}`).join('\n');
                       const blob = new Blob([logText], { type: 'text/plain' });
                       const url = URL.createObjectURL(blob);
                       const a = document.createElement('a');
                       a.href = url;
                       a.download = `resonance_logs_${new Date().getTime()}.txt`;
                       a.click();
                     }}
                     className="px-6 py-3 bg-[#121212] text-white rounded-2xl font-black flex items-center gap-2"
                   >
                     <Download size={18} /> {t.exportLogs}
                   </button>
                   <button 
                     onClick={() => setLogs([])}
                     className="px-6 py-3 bg-red-50 text-red-500 rounded-2xl font-black border border-red-100"
                   >
                     {t.clearLogs}
                   </button>
                </div>
             </header>
             
             <div className="flex-grow overflow-y-auto bg-white rounded-[2.5rem] border border-[#E0DDD5] p-8 font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-300 italic">{t.noLogs}</div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log, i) => (
                      <div key={i} className={cn(
                        "p-4 rounded-xl border-l-4",
                        log.level === 'error' ? 'bg-red-50 border-red-500 text-red-700' :
                        log.level === 'warn' ? 'bg-orange-50 border-orange-500 text-orange-700' :
                        'bg-gray-50 border-gray-300 text-gray-700'
                      )}>
                        <div className="flex justify-between mb-1">
                          <span className="font-black opacity-50">[{log.time}]</span>
                          <span className="font-black uppercase">{log.level}</span>
                        </div>
                        <p className="font-bold">{log.msg}</p>
                        {log.data && (
                          <pre className="mt-2 text-[10px] opacity-70 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-8 md:p-20 overflow-y-auto max-w-4xl mx-auto w-full">
             <header className="mb-12 border-b border-[#E0DDD5] pb-8">
                <h1 className="text-4xl font-serif font-black tracking-tighter text-[#121212]">{t.settings}</h1>
                <p className="text-gray-400 font-bold mt-2">Production Line Configuration</p>
             </header>
             
             <div className="space-y-12">
                <section className="bg-white p-10 rounded-[2.5rem] border border-[#E0DDD5] shadow-sm">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-[#F7F6F2] rounded-2xl"><Key size={24} className="text-[#121212]" /></div>
                      <h3 className="text-xl font-black">{t.apiKeyLabel}</h3>
                   </div>
                   <div className="flex gap-4">
                      <input 
                        type="password" 
                        placeholder={t.apiKeyPlaceholder}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        disabled={isProcessing}
                        className="flex-grow px-6 py-4 bg-[#F7F6F2] rounded-2xl font-bold outline-none border-2 border-transparent focus:border-[#121212] transition-all disabled:opacity-50"
                      />
                      <button 
                        onClick={() => {
                          localStorage.setItem('resonance_api_key', apiKey);
                          alert(t.saveKey + ' Success');
                        }}
                        disabled={isProcessing}
                        className="px-8 py-4 bg-[#121212] text-white rounded-2xl font-black active:scale-95 transition-all disabled:opacity-50"
                      >
                        {t.saveKey}
                      </button>
                      <button 
                        onClick={() => {
                          setApiKey('');
                          localStorage.removeItem('resonance_api_key');
                        }}
                        disabled={isProcessing}
                        className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-50"
                      >
                        <XCircle size={24} />
                      </button>
                   </div>
                </section>

                <section className="bg-white p-10 rounded-[2.5rem] border border-[#E0DDD5] shadow-sm">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-[#F7F6F2] rounded-2xl"><Layers size={24} className="text-[#121212]" /></div>
                      <h3 className="text-xl font-black">{t.batchCountLabel}</h3>
                   </div>
                   <div className="flex items-center gap-8">
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        value={batchCount}
                        disabled={isProcessing}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setBatchCount(val);
                          localStorage.setItem('resonance_batch_count', String(val));
                        }}
                        className="flex-grow h-2 bg-[#F7F6F2] rounded-lg appearance-none cursor-pointer accent-[#121212] disabled:opacity-50"
                      />
                      <span className="text-4xl font-black w-12 text-center">{batchCount}</span>
                   </div>
                </section>

                <section className="bg-white p-10 rounded-[2.5rem] border border-[#E0DDD5] shadow-sm">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-[#F7F6F2] rounded-2xl"><TrendingUp size={24} className="text-[#121212]" /></div>
                      <h3 className="text-xl font-black">{t.totalTargetLabel}</h3>
                   </div>
                   <div className="flex items-center gap-4">
                      <input 
                        type="number" 
                        min="1" 
                        max="1000" 
                        value={totalTargetCount}
                        disabled={isProcessing}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setTotalTargetCount(val);
                          localStorage.setItem('resonance_total_target', String(val));
                        }}
                        className="flex-grow px-6 py-4 bg-[#F7F6F2] rounded-2xl font-bold outline-none border-2 border-transparent focus:border-[#121212] transition-all disabled:opacity-50"
                      />
                   </div>
                </section>

                <section className="bg-white p-10 rounded-[2.5rem] border border-[#E0DDD5] shadow-sm">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-[#F7F6F2] rounded-2xl"><Clock size={24} className="text-[#121212]" /></div>
                      <h3 className="text-xl font-black">{t.intervalLabel}</h3>
                   </div>
                   <div className="flex items-center gap-8">
                      <input 
                        type="range" 
                        min="0" 
                        max="60" 
                        value={intervalDelay}
                        disabled={isProcessing}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setIntervalDelay(val);
                          localStorage.setItem('resonance_interval_delay', String(val));
                        }}
                        className="flex-grow h-2 bg-[#F7F6F2] rounded-lg appearance-none cursor-pointer accent-[#121212] disabled:opacity-50"
                      />
                      <span className="text-4xl font-black w-12 text-center">{intervalDelay}</span>
                   </div>
                </section>

                <section className="bg-white p-10 rounded-[2.5rem] border border-[#E0DDD5] shadow-sm">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-[#F7F6F2] rounded-2xl"><FolderOpen size={24} className="text-[#121212]" /></div>
                      <h3 className="text-xl font-black">{t.selectDir}</h3>
                   </div>

                   {isIframe && (
                     <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3 text-orange-700 text-xs font-bold leading-relaxed">
                        <AlertCircle size={18} className="shrink-0" />
                        <p>{t.iframeWarning}</p>
                     </div>
                   )}
                   {!isIframe && (
                     <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 text-blue-700 text-xs font-bold leading-relaxed">
                        <AlertCircle size={18} className="shrink-0" />
                        <p>{t.reloadWarning}</p>
                     </div>
                   )}
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                         {directoryHandle ? (
                           <div className="flex items-center gap-2 text-green-600 font-bold">
                              <CheckCircle size={20} />
                              <span>{t.dirSelected}: {directoryHandle.name}</span>
                           </div>
                         ) : (hasSavedHandle && !isPathValid) ? (
                           <button 
                             onClick={handleReconnectDirectory}
                             disabled={isProcessing}
                             className="flex items-center gap-2 text-orange-500 font-bold hover:underline disabled:opacity-50 disabled:no-underline"
                           >
                              <AlertCircle size={20} />
                              <span>{t.reconnectDir}</span>
                           </button>
                         ) : (
                           <span className="text-gray-400 font-bold italic">{t.noHandle}</span>
                         )}
                      </div>
                      <button 
                        onClick={handleSelectDirectory}
                        disabled={isIframe || isProcessing}
                        className="px-8 py-4 bg-[#F7F6F2] text-[#121212] border border-[#E0DDD5] rounded-2xl font-black hover:bg-white active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <FolderOpen size={20} />
                        {t.selectDir}
                      </button>
                   </div>

                   <div className="pt-8 border-t border-[#E0DDD5]">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">{t.serverPathLabel}</label>
                      <p className="text-[10px] text-gray-400 mb-4 leading-relaxed">{t.serverPathDesc}</p>
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          placeholder={t.serverPathPlaceholder} 
                          value={serverOutputPath} 
                          onChange={(e) => {
                            setServerOutputPath(e.target.value);
                            setIsPathValid(null);
                          }} 
                          disabled={isProcessing}
                          className="flex-grow px-6 py-4 bg-[#F7F6F2] rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-[#121212] transition-all disabled:opacity-50" 
                        />
                        <button 
                          type="button"
                          onClick={(e) => verifyServerPath(e)}
                          disabled={isProcessing}
                          className={cn(
                            "px-8 py-4 rounded-2xl font-black text-xs transition-all disabled:opacity-50",
                            isPathValid === true ? "bg-green-500 text-white" : 
                            isPathValid === false ? "bg-red-500 text-white" : 
                            "bg-[#121212] text-white"
                          )}
                        >
                          {isPathValid === true ? t.pathValid : isPathValid === false ? t.pathInvalid : t.verifyPath}
                        </button>
                        <button 
                          onClick={() => {
                            setServerOutputPath('');
                            setIsPathValid(null);
                            localStorage.removeItem('resonance_server_path');
                            // Also clear from server config
                            fetch('/api/config', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ serverOutputPath: '' })
                            });
                          }}
                          disabled={isProcessing}
                          className="p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all disabled:opacity-50"
                        >
                          <XCircle size={24} />
                        </button>
                      </div>
                   </div>
                </section>
             </div>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@900&family=Noto+Sans+SC:wght@400;700;900&display=swap');
        body { font-family: 'Noto Sans SC', sans-serif; }
        .font-serif { font-family: 'Noto Serif SC', serif; }
      `}} />
    </div>
  );
}
