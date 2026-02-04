
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search,
  MapPin,
  Download,
  Plus,
  RefreshCw,
  X,
  Phone,
  Mail,
  Globe,
  Loader2,
  CheckSquare,
  Square,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Database,
  Tag,
  ChevronDown,
  ChevronUp,
  LogOut
} from 'lucide-react';
import { supabase } from './services/supabase';
import { triggerSearchWebhook } from './services/webhookService';
import { Prospeccao } from './types';
import { CopyToClipboard } from './components/CopyToClipboard';
import { useAuth } from './contexts/AuthContext';

const APP_LOGO_URL = 'https://ybvkcunddrrqyjffwray.supabase.co/storage/v1/object/public/imagens/Logotipo%20Design%20(1).png';

// Componente de Logout
const LogoutButton: React.FC<{ sidebarOpen: boolean }> = ({ sidebarOpen }) => {
  const { signOut } = useAuth();

  return (
    <button
      onClick={signOut}
      className={`w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${!sidebarOpen ? 'px-0' : 'px-4'}`}
    >
      <LogOut className="w-4 h-4 shrink-0" />
      {sidebarOpen && <span className="text-sm animate-in fade-in">Sair</span>}
    </button>
  );
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [sendingWebhook, setSendingWebhook] = useState(false);
  const [data, setData] = useState<Prospeccao[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<Prospeccao | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  // Estados para o novo comportamento do sidebar
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Search form state
  const [formTerm, setFormTerm] = useState('');
  const [formCity, setFormCity] = useState('');

  const sidebarOpen = sidebarPinned || sidebarHovered;

  const fetchData = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const { data: prospeccaoData, error: supabaseError } = await supabase
        .from('prospeccao')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      const results = prospeccaoData || [];
      setData(results);

      const uniqueCities = Array.from(new Set(results
        .map(item => item.cidade?.trim())
        .filter(Boolean) as string[]))
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));

      setCities(uniqueCities);
    } catch (err: any) {
      console.error('LeadMap Error:', err);
      setError(err.message || 'Erro ao carregar dados do banco.');
    } finally {
      setFetching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription para atualizar dados automaticamente
  useEffect(() => {
    const channel = supabase
      .channel('prospeccao-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prospeccao' },
        (payload) => {
          console.log('Realtime update:', payload);
          // Buscar dados novamente quando houver mudança
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTerm || !formCity) return;

    setSendingWebhook(true);
    const success = await triggerSearchWebhook(formTerm, formCity);
    setSendingWebhook(false);

    if (success) {
      setShowSearchModal(false);
      setFormTerm('');
      setFormCity('');
      setFeedbackModal({ show: true, type: 'success', message: 'Automação enviada! Os dados aparecerão em breve.' });
      setTimeout(fetchData, 45000);
    } else {
      setFeedbackModal({ show: true, type: 'error', message: 'Erro ao disparar automação. Tente novamente.' });
    }
  };

  const citySegments = useMemo(() => {
    if (!selectedCity) return [];
    const cityData = data.filter(item => item.cidade?.trim().toLowerCase() === selectedCity.toLowerCase());
    const segmentCounts: Record<string, number> = {};

    cityData.forEach(item => {
      const seg = item.segmento?.trim();
      if (seg) {
        segmentCounts[seg] = (segmentCounts[seg] || 0) + 1;
      }
    });

    return Object.entries(segmentCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [data, selectedCity]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesCity = selectedCity
        ? item.cidade?.trim().toLowerCase() === selectedCity.toLowerCase()
        : true;
      const matchesSegment = selectedSegment
        ? item.segmento?.trim().toLowerCase() === selectedSegment.toLowerCase()
        : true;
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        item.nome?.toLowerCase().includes(search) ||
        item.telefone?.includes(search) ||
        item.email?.toLowerCase().includes(search) ||
        item.segmento?.toLowerCase().includes(search) ||
        item.bairro?.toLowerCase().includes(search);

      return matchesCity && matchesSegment && matchesSearch;
    });
  }, [data, selectedCity, selectedSegment, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredData.length && filteredData.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map(d => d.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const exportToCSV = () => {
    const itemsToExport = data.filter(item => selectedRows.has(item.id));
    if (itemsToExport.length === 0) return;

    const headers = ['Nome', 'Telefone', 'Cidade', 'Bairro', 'Website', 'Email', 'Segmento'];
    const csvContent = [
      headers.join(','),
      ...itemsToExport.map(item => [
        `"${(item.nome || '').replace(/"/g, '""')}"`,
        `"${item.telefone || ''}"`,
        `"${item.cidade || ''}"`,
        `"${item.bairro || ''}"`,
        `"${item.website || ''}"`,
        `"${item.email || ''}"`,
        `"${item.segmento || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leadmap_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-white font-black tracking-widest text-xs uppercase opacity-40">Sincronizando Leads...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb] text-slate-900 relative">
      {/* Sidebar Overlay */}
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`fixed top-0 left-0 h-full bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out z-40 shadow-2xl ${sidebarOpen ? 'w-80' : 'w-20'}`}
      >
        {/* Toggle de Fixação (Pin) */}
        <button
          onClick={() => setSidebarPinned(!sidebarPinned)}
          className={`absolute -right-3 top-10 bg-blue-600 text-white rounded-full p-1 shadow-lg hover:bg-blue-500 transition-all z-50 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {sidebarPinned ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Header do Sidebar */}
        <div className={`p-6 flex items-center gap-4 border-b border-white/5 overflow-hidden ${!sidebarOpen ? 'justify-center' : ''}`}>
          <div className="shrink-0 w-12 h-12 flex items-center justify-center">
            <img src={APP_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </div>
          {sidebarOpen && (
            <h1 className="text-2xl font-black italic tracking-tighter leading-none bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent pr-6 select-none animate-in fade-in duration-300">
              LeadMap
            </h1>
          )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scrollbar-hide">
          <button
            onClick={() => {
              setSelectedCity(null);
              setSelectedSegment(null);
              setSelectedRows(new Set());
            }}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${selectedCity === null
              ? 'bg-blue-600 text-white shadow-lg'
              : 'hover:bg-slate-800 text-slate-400'
              } ${!sidebarOpen ? 'justify-center' : ''}`}
          >
            <Users className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="text-sm font-bold animate-in fade-in">Todos os Leads</span>}
            {sidebarOpen && (
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${selectedCity === null ? 'bg-white/20' : 'bg-slate-800'}`}>
                {data.length}
              </span>
            )}
          </button>

          {sidebarOpen && (
            <div className="pt-6 pb-2 px-3 flex items-center justify-between animate-in fade-in">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Localidades</span>
            </div>
          )}

          <div className="space-y-1">
            {cities.map(city => (
              <div key={city} className="flex flex-col">
                <button
                  onClick={() => {
                    if (selectedCity === city && !selectedSegment) {
                      setSelectedCity(null);
                      setSelectedSegment(null);
                    } else {
                      setSelectedCity(city);
                      setSelectedSegment(null);
                    }
                    setSelectedRows(new Set());
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${selectedCity === city ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800/50 text-slate-500'
                    } ${!sidebarOpen ? 'justify-center' : ''}`}
                  title={city}
                >
                  <MapPin className={`w-4 h-4 shrink-0 ${selectedCity === city ? 'text-blue-500' : 'text-slate-600'}`} />
                  {sidebarOpen && <span className="truncate capitalize text-sm flex-1 text-left animate-in fade-in">{city}</span>}
                  {sidebarOpen && selectedCity === city && <ChevronUp className="w-3 h-3 text-slate-400 animate-in fade-in" />}
                  {sidebarOpen && selectedCity !== city && <ChevronDown className="w-3 h-3 text-slate-600 animate-in fade-in" />}
                </button>

                {/* Sub-menu Segmentos */}
                {sidebarOpen && selectedCity === city && (
                  <div className="ml-8 mt-1 space-y-1 border-l border-slate-800 pl-4 animate-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => {
                        setSelectedSegment(null);
                        setSelectedRows(new Set());
                      }}
                      className={`w-full text-left text-[11px] py-2 px-3 rounded-lg transition-all flex items-center gap-2 ${selectedSegment === null ? 'text-blue-400 font-bold bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      <span className="flex-1">Todos os Segmentos</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${selectedSegment === null ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                        {citySegments.reduce((acc, seg) => acc + seg.count, 0)}
                      </span>
                    </button>
                    {citySegments.map(seg => (
                      <button
                        key={seg.name}
                        onClick={() => {
                          setSelectedSegment(seg.name);
                          setSelectedRows(new Set());
                        }}
                        className={`w-full text-left text-[11px] py-2 px-3 rounded-lg transition-all flex items-center gap-2 ${selectedSegment === seg.name ? 'text-blue-400 font-bold bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'
                          }`}
                      >
                        <Tag size={12} className={selectedSegment === seg.name ? 'text-blue-400' : 'text-slate-600'} />
                        <span className="truncate capitalize flex-1">{seg.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${selectedSegment === seg.name ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                          {seg.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Rodapé Sidebar */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => setShowSearchModal(true)}
            className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${!sidebarOpen ? 'px-0' : 'px-4'}`}
          >
            <Plus className="w-5 h-5 shrink-0" />
            {sidebarOpen && <span className="animate-in fade-in">NOVA BUSCA</span>}
          </button>
          <LogoutButton sidebarOpen={sidebarOpen} />
        </div>
      </aside>

      {/* Main Content - Adicionado pl-20 para dar espaço ao sidebar "mini" fixo */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pl-20">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 z-10">
          <div className="flex items-center gap-6 flex-1">
            <div className="flex flex-col">
              <h2 className="text-xl font-black text-slate-900 tracking-tight capitalize truncate max-w-[300px]">
                {selectedCity || "Fluxo de Leads"}
              </h2>
              {selectedSegment && (
                <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-black uppercase tracking-widest mt-0.5">
                  <Tag size={10} />
                  {selectedSegment}
                </div>
              )}
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Pesquisar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 rounded-xl py-2.5 pl-11 pr-4 focus:ring-2 focus:ring-blue-500/10 focus:bg-white outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              disabled={fetching}
              className="p-2.5 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${fetching ? 'animate-spin text-blue-500' : ''}`} />
            </button>
            <button
              onClick={exportToCSV}
              disabled={selectedRows.size === 0}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all disabled:opacity-20 shadow-lg shadow-slate-900/10 active:scale-95"
            >
              <Download className="w-4 h-4" />
              EXPORTAR ({selectedRows.size})
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-10">
          {error && (
            <div className="mb-8 bg-red-50 border border-red-100 text-red-600 p-5 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 shadow-sm">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div className="text-sm">
                <p className="font-bold">Erro de Banco de Dados</p>
                <p className="opacity-80">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="py-5 px-8 w-14">
                      <button onClick={toggleSelectAll} className="text-slate-300 hover:text-blue-600 transition-colors">
                        {selectedRows.size === filteredData.length && filteredData.length > 0 ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                    <th className="py-5 px-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Empresa / Emails</th>
                    <th className="py-5 px-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Segmento</th>
                    <th className="py-5 px-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Contato</th>
                    <th className="py-5 px-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Localização</th>
                    <th className="py-5 px-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Digital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-32 text-center text-slate-300">
                        <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="italic">Nenhum lead encontrado para este filtro.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map(item => (
                      <tr key={item.id} className={`hover:bg-blue-50/10 transition-all ${selectedRows.has(item.id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="py-6 px-8">
                          <button onClick={() => toggleSelectRow(item.id)} className={`${selectedRows.has(item.id) ? 'text-blue-600 scale-110' : 'text-slate-200 hover:text-slate-400'} transition-all`}>
                            {selectedRows.has(item.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex flex-col gap-1.5 max-w-[200px]">
                            <button
                              onClick={() => setSelectedLead(item)}
                              title={item.nome || 'S/ Nome'}
                              className="text-slate-900 font-black text-[14px] leading-tight hover:text-blue-600 transition-colors truncate text-left cursor-pointer"
                            >
                              {item.nome || 'S/ Nome'}
                            </button>
                            {(item.email || item.email2) && (
                              <div className="space-y-1 mt-1">
                                {item.email && (
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold group">
                                    <Mail className="w-3 h-3 text-blue-500/60 shrink-0" />
                                    <CopyToClipboard text={item.email} type="Email" className="hover:text-blue-600 truncate" />
                                  </div>
                                )}
                                {item.email2 && (
                                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium group">
                                    <Mail className="w-3 h-3 text-slate-300 shrink-0" />
                                    <CopyToClipboard text={item.email2} type="Email" className="hover:text-blue-600 truncate" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-blue-500/40" />
                            <CopyToClipboard
                              text={item.segmento || ''}
                              label={item.segmento || 'Não Definido'}
                              type="Segmento"
                              className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border ${item.segmento ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                            />
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-green-50 rounded-xl text-green-600 border border-green-100 shadow-sm flex items-center justify-center">
                              <Phone className="w-4 h-4" />
                            </div>
                            <CopyToClipboard
                              text={item.telefone}
                              type="Telefone"
                              className="text-slate-900 font-black font-mono tracking-tighter text-sm hover:text-green-600 transition-colors"
                            />
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-slate-300" />
                              <span className="text-slate-800 font-bold text-sm capitalize leading-none">{item.cidade || '-'}</span>
                            </div>
                            <span className="text-slate-400 text-[10px] font-medium truncate max-w-[140px] ml-5 leading-none">{item.bairro || 'Endereço indisponível'}</span>
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          {item.website ? (
                            <a
                              href={item.website.startsWith('http') ? item.website : `https://${item.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-900 hover:text-white transition-all text-[10px] font-black tracking-widest uppercase shadow-sm group"
                            >
                              <Globe className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-400" />
                              Site
                            </a>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-300 rounded-xl text-[9px] font-black tracking-widest uppercase border border-slate-100/50">
                              <X size={10} />
                              Offline
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Busca Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12">
            <div className="px-10 py-10 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-black tracking-tight">Nova Captura</h3>
                <p className="text-slate-400 text-sm mt-1">Disparar automação n8n inteligente</p>
              </div>
              <button onClick={() => setShowSearchModal(false)} className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-7 h-7" />
              </button>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl -mr-10 -mt-10 rounded-full"></div>
            </div>

            <form onSubmit={handleWebhookSubmit} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nicho (Ex: Petshops)</label>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    required
                    type="text"
                    placeholder="Quais estabelecimentos buscar?"
                    value={formTerm}
                    onChange={(e) => setFormTerm(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 pl-14 pr-6 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade Alvo</label>
                <div className="relative group">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    required
                    type="text"
                    placeholder="Em qual cidade prospectar?"
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 pl-14 pr-6 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black py-5 rounded-3xl transition-all"
                >
                  FECHAR
                </button>
                <button
                  type="submit"
                  disabled={sendingWebhook}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-3xl transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {sendingWebhook ? <Loader2 className="w-6 h-6 animate-spin" /> : <>INICIAR BUSCA <Users size={18} /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Empresa */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12">
            <div className="px-8 py-8 bg-slate-900 text-white relative overflow-hidden">
              <button
                onClick={() => setSelectedLead(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-xl font-black tracking-tight pr-10 leading-tight">
                {selectedLead.nome || 'Empresa sem nome'}
              </h3>
              {selectedLead.segmento && (
                <div className="flex items-center gap-2 mt-3">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">{selectedLead.segmento}</span>
                </div>
              )}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl -mr-10 -mt-10 rounded-full"></div>
            </div>

            <div className="p-8 space-y-5">
              {/* Telefone */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-50 rounded-xl text-green-600 border border-green-100">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Telefone</p>
                  <CopyToClipboard
                    text={selectedLead.telefone}
                    type="Telefone"
                    className="text-slate-900 font-black font-mono text-lg hover:text-green-600 transition-colors"
                  />
                </div>
              </div>

              {/* Emails */}
              {(selectedLead.email || selectedLead.email2) && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">E-mail</p>
                    {selectedLead.email && (
                      <CopyToClipboard
                        text={selectedLead.email}
                        type="Email"
                        className="text-slate-700 font-bold text-sm hover:text-blue-600 transition-colors block"
                      />
                    )}
                    {selectedLead.email2 && (
                      <CopyToClipboard
                        text={selectedLead.email2}
                        type="Email"
                        className="text-slate-500 font-medium text-sm hover:text-blue-600 transition-colors block mt-1"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Localização */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Localização</p>
                  <p className="text-slate-900 font-bold capitalize">{selectedLead.cidade || 'Cidade não informada'}</p>
                  <p className="text-slate-500 text-sm">{selectedLead.bairro || 'Bairro não informado'}</p>
                </div>
              </div>

              {/* Website */}
              {selectedLead.website && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-600 border border-purple-100">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Website</p>
                    <a
                      href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 font-bold text-sm hover:text-purple-800 transition-colors break-all"
                    >
                      {selectedLead.website}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 pb-8">
              <button
                onClick={() => setSelectedLead(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Feedback (Sucesso/Erro) */}
      {feedbackModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-12">
            <div className={`px-8 py-8 ${feedbackModal.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white relative overflow-hidden`}>
              <div className="flex justify-center mb-4">
                {feedbackModal.type === 'success' ? (
                  <CheckSquare className="w-16 h-16 opacity-90" />
                ) : (
                  <X className="w-16 h-16 opacity-90" />
                )}
              </div>
              <h3 className="text-xl font-black tracking-tight text-center">
                {feedbackModal.type === 'success' ? 'Sucesso!' : 'Erro'}
              </h3>
            </div>

            <div className="p-8">
              <p className="text-slate-600 text-center text-sm leading-relaxed">
                {feedbackModal.message}
              </p>
            </div>

            <div className="px-8 pb-8">
              <button
                onClick={() => setFeedbackModal({ ...feedbackModal, show: false })}
                className={`w-full ${feedbackModal.type === 'success' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} text-white font-black py-4 rounded-2xl transition-all`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
