import React, { useEffect } from 'react';
import { XCircle, CheckCircle, Repeat } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

// --- Toast Notification ---
export const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const alertType = type === 'error' ? 'alert-error' : type === 'info' ? 'alert-info' : 'alert-success';
  return (
    <div className="toast toast-top toast-end z-[9999]">
      <div className={`alert ${alertType} shadow-lg animate-bounce-in`}>
        {type === 'error' ? <XCircle size={20}/> : type==='info' ? <Repeat size={20}/> : <CheckCircle size={20}/>}
        <span>{message}</span>
      </div>
    </div>
  );
};

// --- Modal Popup ---
export const Modal = ({ title, children, isOpen, onClose, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`bg-base-100 rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col border border-base-200`}>
        <div className="flex justify-between items-center p-5 border-b border-base-200">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost"><XCircle size={20}/></button>
        </div>
        <div className="p-5 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

// --- Loading Skeleton ---
export const SkeletonCard = () => (
  <div className="card bg-base-100 shadow border border-base-200 p-4 animate-pulse h-32">
    <div className="flex gap-4 h-full">
      <div className="h-12 w-12 bg-base-200 rounded-full"></div>
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-base-200 rounded w-3/4"></div>
        <div className="h-4 bg-base-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

// --- Bar Chart ---
export const SimpleBarChart = ({ data }) => {
    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 100);
    return (
        <div className="flex items-end justify-between h-64 gap-2 pt-8 pb-2">
            {data.map((d, i) => (
                <div key={i} className="flex flex-col items-center justify-end h-full flex-1 gap-1 group">
                     <div className="relative w-full flex justify-center gap-1 h-full items-end">
                        <div style={{ height: `${(d.income / maxVal) * 100}%` }} className="w-3 md:w-6 bg-success/80 rounded-t-sm transition-all group-hover:bg-success relative">
                             <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-base-300 text-xs p-1 rounded z-10 whitespace-nowrap">{formatCurrency(d.income)}</div>
                        </div>
                        <div style={{ height: `${(d.expense / maxVal) * 100}%` }} className="w-3 md:w-6 bg-error/80 rounded-t-sm transition-all group-hover:bg-error relative">
                             <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-base-300 text-xs p-1 rounded z-10 whitespace-nowrap">{formatCurrency(d.expense)}</div>
                        </div>
                     </div>
                     <span className="text-[10px] md:text-xs uppercase font-bold opacity-50">{d.label}</span>
                </div>
            ))}
        </div>
    );
};

// --- Pie Chart ---
export const SimplePieChart = ({ data }) => {
    let cumulativePercent = 0;
    const gradientString = data.map(d => {
        const start = cumulativePercent;
        cumulativePercent += d.percent;
        return `${d.color} ${start}% ${cumulativePercent}%`;
    }).join(', ');

    return (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="w-48 h-48 rounded-full shadow-inner border-4 border-base-100" style={{ background: `conic-gradient(${gradientString})` }}></div>
            <div className="grid grid-cols-1 gap-2">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{background: d.color}}></div>
                        <span className="flex-1 font-medium">{d.label}</span>
                        <span className="font-bold">{formatCurrency(d.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const LoadingScreen = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <span className="loading loading-ring loading-lg text-primary"></span>
  </div>
);