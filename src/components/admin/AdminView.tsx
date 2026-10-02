'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useCompendiumStore } from '@/stores/useCompendiumStore';
import { useShopStore } from '@/stores/useShopStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCharacterStore } from '@/stores/useCharacterStore';
import { useNavigationStore } from '@/stores/useNavigationStore';
import { PublicUser } from '@/types/shared';
import { tacticalAudio } from '@/lib/audio';
import { useConfigStore } from '@/stores/useConfigStore';
import { EntityEditorModal, EditableEntityType } from './EntityEditorModal';
import { InternalLoader } from '../ui/InternalLoader';
import { AdminShopManager } from './AdminShopManager';
import {
  Shield,
  Plus,
  Edit2,
  Copy,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Search,
  Users,
  User,
  FileText,
  Clock,
  Key,
  ShieldCheck,
  ShieldAlert,
  Settings,
  ShoppingCart,
} from 'lucide-react';

type AdminTab = 'armas' | 'attachments' | 'habilidades' | 'classes' | 'lore' | 'operadores' | 'backup' | 'configuracoes' | 'loja';

export const AdminView: React.FC = () => {
  const {
    weapons,
    attachments,
    ammunitions,
    classes,
    abilities,
    loreRules,
    auditLogs,
    fetchCompendium,
    saveEntity,
    deleteEntity,
    restoreDefaults,
    importCompendium,
  } = useCompendiumStore();

  const { user } = useAuthStore();
  const { backgroundImage, backgroundLibrary, setBackgroundImage, fetchBackgrounds, uploadBackground, deleteBackground } = useConfigStore();
  React.useEffect(() => { fetchBackgrounds(); }, []);
  const shopStore = useShopStore();
  React.useEffect(() => { shopStore.fetchShopState(); }, []);

  const [activeTab, setActiveTab] = useState<AdminTab>('armas');
  const [searchQuery, setSearchQuery] = useState('');
  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    type: EditableEntityType;
    data?: any;
  }>({
    isOpen: false,
    type: 'weapon',
  });

  // Operators state
  const [operators, setOperators] = useState<PublicUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [operatorMsg, setOperatorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCompendium();
  }, [fetchCompendium]);

  const loadOperators = async () => {
    try {
      setIsLoadingUsers(true);
      const res = await fetch('/api/users');
      const json = await res.json();
      if (res.ok && json.users) {
        setOperators(json.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'operadores') {
      loadOperators();
    }
  }, [activeTab]);

  // Tab definitions
  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'armas', label: `Armas (${weapons.length})`, icon: FileText },
    { id: 'attachments', label: `Attachments (${attachments.length})`, icon: FileText },
    { id: 'habilidades', label: `Habilidades (${abilities.length})`, icon: FileText },
    { id: 'classes', label: `Classes (${classes.length})`, icon: FileText },
    { id: 'lore', label: `Lore & Regras (${loreRules.length})`, icon: FileText },
    { id: 'operadores', label: 'Operadores', icon: Users },
    { id: 'backup', label: 'Backup & Auditoria', icon: Clock },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
    { id: 'loja', label: 'Loja (Shop)', icon: ShoppingCart },
  ];

  // Filtered items based on activeTab and searchQuery
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    switch (activeTab) {
      case 'armas':
        return weapons.filter((w) => !q || w.name.toLowerCase().includes(q) || w.type.toLowerCase().includes(q));
      case 'attachments':
        return attachments.filter((a) => !q || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
      case 'habilidades':
        return abilities.filter((ab) => !q || ab.name.toLowerCase().includes(q) || ab.className.toLowerCase().includes(q));
      case 'classes':
        return classes.filter((c) => !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
      case 'lore':
        return loreRules.filter((l) => !q || l.title.toLowerCase().includes(q) || l.category.toLowerCase().includes(q));
      default:
        return [];
    }
  }, [activeTab, searchQuery, weapons, attachments, abilities, classes, loreRules]);

  // CRUD Actions
  const handleCreate = () => {
    tacticalAudio.playSelect();
    const typeMap: Record<string, EditableEntityType> = {
      armas: 'weapon',
      attachments: 'attachment',
      habilidades: 'ability',
      classes: 'class',
      lore: 'lore_rule',
    };
    const entityType = typeMap[activeTab] || 'weapon';
    setEditorState({ isOpen: true, type: entityType });
  };

  const handleEdit = (item: any) => {
    tacticalAudio.playSelect();
    const typeMap: Record<string, EditableEntityType> = {
      armas: 'weapon',
      attachments: 'attachment',
      habilidades: 'ability',
      classes: 'class',
      lore: 'lore_rule',
    };
    const entityType = typeMap[activeTab] || 'weapon';
    setEditorState({ isOpen: true, type: entityType, data: item });
  };

  const handleDuplicate = (item: any) => {
    tacticalAudio.playSelect();
    const typeMap: Record<string, EditableEntityType> = {
      armas: 'weapon',
      attachments: 'attachment',
      habilidades: 'ability',
      classes: 'class',
      lore: 'lore_rule',
    };
    const entityType = typeMap[activeTab] || 'weapon';
    const clone = structuredClone(item);
    clone.id = `${clone.id}-copy-${Date.now().toString(36).slice(2, 5)}`;
    if (clone.name) clone.name = `${clone.name} (Cópia)`;
    if (clone.title) clone.title = `${clone.title} (Cópia)`;
    setEditorState({ isOpen: true, type: entityType, data: clone });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR o registro "${name}"?`)) {
      return;
    }
    tacticalAudio.playAlert();
    const typeMap: Record<string, any> = {
      armas: 'weapon',
      attachments: 'attachment',
      habilidades: 'ability',
      classes: 'class',
      lore: 'lore_rule',
    };
    const entityType = typeMap[activeTab] || 'weapon';
    await deleteEntity(entityType, id, user?.username || 'admin');
  };

  const handleSaveEntity = async (type: EditableEntityType, data: any) => {
    await saveEntity(type, data, user?.username || 'admin');
  };

  // Export / Import / Restore
  const handleExportJSON = () => {
    tacticalAudio.playSelect();
    const fullData = {
      weapons,
      attachments,
      ammunitions,
      classes,
      abilities,
      loreRules,
      exportTimestamp: new Date().toISOString(),
      exportedBy: user?.username || 'admin',
    };
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codak-compendium-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (window.confirm('Importar este compêndio substituirá os dados atuais. Deseja continuar?')) {
        tacticalAudio.playSelect();
        await importCompendium(parsed, user?.username || 'admin');
      }
    } catch (err: any) {
      alert('Arquivo JSON inválido ou corrompido: ' + err.message);
      tacticalAudio.playAlert();
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRestoreDefaults = async () => {
    if (window.confirm('ATENÇÃO: Deseja restaurar todos os dados oficiais de fábrica do CODAK? Quaisquer itens customizados serão resetados.')) {
      tacticalAudio.playAlert();
      await restoreDefaults(user?.username || 'admin');
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadBackground(file);
      tacticalAudio.playSelect();
    } catch {
      alert('Erro ao fazer upload da imagem.');
    }
    // reset input so the same file can be re-uploaded
    e.target.value = '';
  };

  // Operators Actions
  const handleToggleRole = async (opUser: PublicUser) => {
    const newRole = opUser.role === 'admin' ? 'player' : 'admin';
    const actionLabel = newRole === 'admin' ? 'promover a Mestre' : 'rebaixar a Jogador';
    if (!window.confirm(`Deseja ${actionLabel} o operador "${opUser.displayName}"?`)) return;

    try {
      tacticalAudio.playSelect();
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_role',
          userId: opUser.id,
          newRole,
          adminUsername: user?.username || 'admin',
        }),
      });
      const json = await res.json();
      if (res.ok && json.users) {
        setOperators(json.users);
        setOperatorMsg(`Papel de ${opUser.displayName} atualizado com sucesso.`);
      } else {
        alert(json.error || 'Falha ao atualizar papel.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetPassword = async (opUser: PublicUser) => {
    const newPass = window.prompt(`Digite a nova senha para ${opUser.displayName}:`);
    if (!newPass || newPass.trim().length < 3) {
      if (newPass !== null) alert('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    try {
      tacticalAudio.playSelect();
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          userId: opUser.id,
          newPassword: newPass.trim(),
          adminUsername: user?.username || 'admin',
        }),
      });
      const json = await res.json();
      if (res.ok) {
        alert(`Senha de ${opUser.displayName} redefinida com sucesso!`);
      } else {
        alert(json.error || 'Erro ao redefinir senha.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteOperator = async (opUser: PublicUser) => {
    if (!window.confirm(`Deseja EXCLUIR permanentemente a conta de "${opUser.displayName}"?`)) return;

    try {
      tacticalAudio.playAlert();
      const res = await fetch(`/api/users?userId=${encodeURIComponent(opUser.id)}&adminUsername=${encodeURIComponent(user?.username || 'admin')}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.users) {
        setOperators(json.users);
      } else {
        alert(json.error || 'Erro ao remover operador.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Hidden File Input for JSON Compendium Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Header Bar */}
      <div
        className="hud-panel-chamfer"
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'rgba(12, 10, 16, 0.95)',
          borderLeft: '3px solid var(--color-red-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--color-red-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-red-primary)',
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-red-primary)', fontWeight: 800 }}>
              SISTEMA ADMINISTRATIVO // COMPÊNDIO DINÂMICO
            </div>
            <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 900, color: '#fff', margin: 0 }}>
              GESTÃO DE REGRAS & DADOS DO MESTRE
            </h1>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportJSON}
            className="hud-btn hud-btn-outline"
            style={{ padding: '6px 12px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Exportar todo o compêndio em um arquivo JSON"
          >
            <Download size={13} />
            <span>EXPORTAR COMPÊNDIO</span>
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            className="hud-btn hud-btn-outline"
            style={{ padding: '6px 12px', fontSize: '10.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Importar um compêndio em JSON externo"
          >
            <Upload size={13} />
            <span>IMPORTAR JSON</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="hud-btn hud-btn-ghost"
            style={{ padding: '6px 12px', fontSize: '10.5px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Restaurar dados oficiais originais do sistema"
          >
            <RotateCcw size={13} />
            <span>RESTAURAR FÁBRICA</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: 'var(--border-subtle)',
          paddingBottom: '2px',
          overflowX: 'auto',
        }}
      >
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className={`hud-tab ${isActive ? 'is-active' : ''}`}
              style={{ padding: '8px 16px', fontSize: '11px', whiteSpace: 'nowrap' }}
              onClick={() => {
                setActiveTab(t.id);
                setSearchQuery('');
                tacticalAudio.playSelect();
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area by Tab */}
      <div
        className="grimoire-content-panel"
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
      >
        {/* Top Controls for entity tabs (armas, attachments, habilidades, classes, lore) */}
        {!['operadores', 'backup'].includes(activeTab) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '14px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: '400px' }}>
              <Search
                size={15}
                color="var(--color-red-primary)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder={`Pesquisar em ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hud-input"
                style={{ width: '100%', paddingLeft: '32px', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--text-muted)' }}>
                [ {filteredData.length} REGISTROS ]
              </span>

              <button
                type="button"
                onClick={handleCreate}
                className="hud-btn hud-btn-primary"
                style={{ padding: '7px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                <span>NOVO REGISTRO</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. WEAPONS TABLE */}
        {activeTab === 'armas' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>NOME</th>
                  <th style={{ padding: '8px' }}>TIPO</th>
                  <th style={{ padding: '8px' }}>PORTE</th>
                  <th style={{ padding: '8px' }}>DANO</th>
                  <th style={{ padding: '8px' }}>SWEET SPOT</th>
                  <th style={{ padding: '8px' }}>PENTE</th>
                  <th style={{ padding: '8px' }}>PREÇO</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((w: any) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '8px', fontWeight: 700, color: '#fff' }}>{w.name}</td>
                    <td style={{ padding: '8px', color: 'var(--color-amber-primary)' }}>{w.type}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{w.size}</td>
                    <td style={{ padding: '8px', color: 'var(--color-red-primary)', fontWeight: 700 }}>{w.baseDamage}</td>
                    <td style={{ padding: '8px', color: '#fff' }}>{w.sweetSpot}m ({w.sweetSpotBonusDamage || '0'})</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{w.ammoCapacity}</td>
                    <td style={{ padding: '8px', color: 'var(--color-amber-primary)' }}>₵ {w.cost?.toLocaleString()}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleEdit(w)}
                          className="hud-btn hud-btn-outline"
                          style={{ padding: '3px 6px', fontSize: '9.5px' }}
                          title="Editar Armamento"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(w)}
                          className="hud-btn hud-btn-outline"
                          style={{ padding: '3px 6px', fontSize: '9.5px' }}
                          title="Duplicar como novo"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(w.id, w.name)}
                          className="hud-btn hud-btn-ghost"
                          style={{ padding: '3px 6px', fontSize: '9.5px', color: '#ef4444' }}
                          title="Excluir"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. ATTACHMENTS TABLE */}
        {activeTab === 'attachments' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>NOME</th>
                  <th style={{ padding: '8px' }}>CATEGORIA</th>
                  <th style={{ padding: '8px' }}>SLOTS</th>
                  <th style={{ padding: '8px' }}>PREÇO</th>
                  <th style={{ padding: '8px' }}>EFEITO TÁTICO</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((a: any) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '8px', fontWeight: 700, color: '#fff' }}>{a.name}</td>
                    <td style={{ padding: '8px', color: 'var(--color-amber-primary)' }}>{a.category}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{a.slots}</td>
                    <td style={{ padding: '8px', color: 'var(--color-amber-primary)' }}>₵ {a.price}</td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)', maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.effect}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleEdit(a)}
                          className="hud-btn hud-btn-outline"
                          style={{ padding: '3px 6px', fontSize: '9.5px' }}
                          title="Editar"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(a)}
                          className="hud-btn hud-btn-outline"
                          style={{ padding: '3px 6px', fontSize: '9.5px' }}
                          title="Duplicar"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(a.id, a.name)}
                          className="hud-btn hud-btn-ghost"
                          style={{ padding: '3px 6px', fontSize: '9.5px', color: '#ef4444' }}
                          title="Excluir"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. ABILITIES TABLE */}
        {activeTab === 'habilidades' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>NOME</th>
                  <th style={{ padding: '8px' }}>CLASSE</th>
                  <th style={{ padding: '8px' }}>AÇÃO</th>
                  <th style={{ padding: '8px' }}>NVL</th>
                  <th style={{ padding: '8px' }}>USOS / RECARGA</th>
                  <th style={{ padding: '8px' }}>RESUMO</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((ab: any) => (
                  <tr key={ab.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '8px', fontWeight: 700, color: '#fff' }}>{ab.name}</td>
                    <td style={{ padding: '8px', color: 'var(--color-cyan-primary)' }}>{ab.className}</td>
                    <td style={{ padding: '8px', color: 'var(--color-red-primary)' }}>{ab.actionCost}</td>
                    <td style={{ padding: '8px', color: 'var(--color-amber-primary)' }}>{ab.level}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{ab.usageLimit}</td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {ab.summary}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleEdit(ab)}
                          className="hud-btn hud-btn-outline"
                          style={{ padding: '3px 6px', fontSize: '9.5px' }}
                          title="Editar"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(ab)}
                          className="hud-btn hud-btn-outline"
                          style={{ padding: '3px 6px', fontSize: '9.5px' }}
                          title="Duplicar"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ab.id, ab.name)}
                          className="hud-btn hud-btn-ghost"
                          style={{ padding: '3px 6px', fontSize: '9.5px', color: '#ef4444' }}
                          title="Excluir"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. CLASSES TABLE */}
        {activeTab === 'classes' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>CÓD</th>
                  <th style={{ padding: '8px' }}>CLASSE</th>
                  <th style={{ padding: '8px' }}>DADO DE VIDA</th>
                  <th style={{ padding: '8px' }}>SALVAGUARDAS</th>
                  <th style={{ padding: '8px' }}>SUBCLASSES</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((c: any) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '8px', color: 'var(--color-red-primary)', fontWeight: 800 }}>{c.code}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: '#fff' }}>{c.name}</td>
                    <td style={{ padding: '8px', color: 'var(--color-amber-primary)' }}>{c.hitDice}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{c.savingThrows?.join(', ')}</td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{c.subclasses?.length || 0} ramos</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleEdit(c)}
                          className="hud-btn hud-btn-outline"
                          style={{ padding: '3px 6px', fontSize: '9.5px' }}
                          title="Editar"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(c)}
                          className="hud-btn hud-btn-outline"
                          style={{ padding: '3px 6px', fontSize: '9.5px' }}
                          title="Duplicar"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.name)}
                          className="hud-btn hud-btn-ghost"
                          style={{ padding: '3px 6px', fontSize: '9.5px', color: '#ef4444' }}
                          title="Excluir"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. LORE & RULES TABLE */}
        {activeTab === 'lore' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>TÍTULO</th>
                  <th style={{ padding: '8px' }}>CATEGORIA</th>
                  <th style={{ padding: '8px' }}>SUBTÍTULO</th>
                  <th style={{ padding: '8px' }}>RESUMO</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((l: any) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '8px', fontWeight: 700, color: '#fff' }}>{l.title}</td>
                    <td style={{ padding: '8px', color: 'var(--color-amber-primary)' }}>{l.category}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{l.subtitle}</td>
                    <td style={{ padding: '8px', color: 'var(--text-secondary)', maxWidth: '350px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.summary}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleEdit(l)}
                          className="hud-btn hud-btn-outline"
                          style={{ padding: '3px 6px', fontSize: '9.5px' }}
                          title="Editar"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(l)}
                          className="hud-btn hud-btn-outline"
                          style={{ padding: '3px 6px', fontSize: '9.5px' }}
                          title="Duplicar"
                        >
                          <Copy size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(l.id, l.title)}
                          className="hud-btn hud-btn-ghost"
                          style={{ padding: '3px 6px', fontSize: '9.5px', color: '#ef4444' }}
                          title="Excluir"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. OPERATORS TAB */}
        {activeTab === 'operadores' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-amber-primary)', fontWeight: 800 }}>
                OPERADORES REGISTRADOS NO SISTEMA ({operators.length})
              </div>
              <button
                type="button"
                onClick={loadOperators}
                className="hud-btn hud-btn-outline"
                style={{ padding: '4px 10px', fontSize: '10px' }}
              >
                ATUALIZAR LISTA
              </button>
            </div>

            {operatorMsg && (
              <div style={{ padding: '8px 12px', background: 'rgba(34, 197, 94, 0.15)', borderLeft: '3px solid #22c55e', color: '#86efac', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                {operatorMsg}
              </div>
            )}

            {isLoadingUsers ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px', gap: '16px' }}>
                <InternalLoader type="rect" color="var(--color-amber-primary)" />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>BUSCANDO OPERADORES...</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>CALLSIGN</th>
                    <th style={{ padding: '8px' }}>USUÁRIO</th>
                    <th style={{ padding: '8px' }}>PAPEL / ACESSO</th>
                    <th style={{ padding: '8px' }}>CRIADO EM</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>AÇÕES DE COMANDO</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((op) => {
                  const isCurrent = op.id === user?.id;
                  const isOpAdmin = op.role === 'admin';
                  return (
                    <React.Fragment key={op.id}>
                    <tr  style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '8px', fontWeight: 700, color: '#fff' }}>
                        {op.displayName} {isCurrent && <span style={{ color: 'var(--color-amber-primary)', fontSize: '9px' }}>(VOCÊ)</span>}
                      </td>
                      <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{op.username}</td>
                      <td style={{ padding: '8px' }}>
                        <span className={`hud-badge ${isOpAdmin ? 'hud-badge-red' : 'hud-badge-cyan'}`} style={{ fontSize: '9.5px' }}>
                          {isOpAdmin ? 'MESTRE (ADMIN)' : 'JOGADOR (OPERADOR)'}
                        </span>
                      </td>
                      <td style={{ padding: '8px', color: 'var(--text-muted)', fontSize: '10px' }}>
                        {op.createdAt ? new Date(op.createdAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleRole(op)}
                            disabled={isCurrent && isOpAdmin}
                            className={`hud-btn ${isOpAdmin ? 'hud-btn-ghost' : 'hud-btn-primary'}`}
                            style={{ padding: '3px 8px', fontSize: '9.5px', opacity: isCurrent && isOpAdmin ? 0.4 : 1 }}
                            title={isOpAdmin ? 'Rebaixar a Jogador' : 'Promover a Mestre'}
                          >
                            {isOpAdmin ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                            <span>{isOpAdmin ? 'REBAIXAR' : 'PROMOVER A MESTRE'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetPassword(op)}
                            className="hud-btn hud-btn-outline"
                            style={{ padding: '3px 8px', fontSize: '9.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Redefinir senha de acesso"
                          >
                            <Key size={11} />
                            <span>SENHA</span>
                          </button>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOperator(op)}
                              className="hud-btn hud-btn-ghost"
                              style={{ padding: '3px 6px', fontSize: '9.5px', color: '#ef4444' }}
                              title="Remover conta"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0,0,0,0.2)' }}>
                      <td colSpan={5} style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>PERSONAGENS:</span>
                          {useCharacterStore.getState().characters.filter(c => (c as any).userId === op.id || ((c as any).userId === undefined && op.username === 'admin')).map(c => (
                            <button
                              key={c.id}
                              onClick={() => {
                                tacticalAudio.playSelect();
                                useCharacterStore.getState().openCharacterSheet(c.id);
                                useNavigationStore.getState().selectView('characters');
                              }}
                              className="hud-btn hud-btn-outline"
                              style={{ padding: '2px 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Abrir Ficha"
                            >
                              <User size={10} />
                              {c.name}
                            </button>
                          ))}
                          {useCharacterStore.getState().characters.filter(c => (c as any).userId === op.id || ((c as any).userId === undefined && op.username === 'admin')).length === 0 && (
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>NENHUM PERSONAGEM</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        )}

        {activeTab === 'loja' && (
          <div style={{ flex: 1, padding: '20px', color: '#fff', overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <AdminShopManager />
          </div>
        )}


        {activeTab === 'configuracoes' && (
          <div style={{ flex: 1, padding: '20px', color: '#fff', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', marginBottom: '16px', color: 'var(--color-amber-primary)' }}>
              CONFIGURAÇÕES GLOBAIS
            </h2>

            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Left Side: Inputs */}
              <div style={{ flex: '1 1 300px', minWidth: '300px', maxWidth: '500px' }}>
                {/* Upload Button */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    UPLOAD DE PLANO DE FUNDO
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} className="hud-btn">
                    <Upload size={14} /> Selecionar Imagem
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    Imagens são salvas no servidor e persistem entre sessões. Clique em uma imagem para ativá-la.
                  </p>
                </div>

                {/* Background Carousel */}
                {backgroundLibrary.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      BIBLIOTECA ({backgroundLibrary.length})
                    </label>
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                      {/* None option */}
                      <div
                        onClick={() => setBackgroundImage(null)}
                        style={{
                          flexShrink: 0,
                          width: '160px',
                          aspectRatio: '16/9',
                          background: '#0a0a0e',
                          border: backgroundImage === null ? '2px solid var(--color-amber-primary)' : '2px solid rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                          transition: 'border-color 0.2s',
                        }}
                      >
                        NENHUM
                      </div>

                      {backgroundLibrary.map((imgPath) => (
                        <div
                          key={imgPath}
                          style={{ flexShrink: 0, position: 'relative', width: '160px', aspectRatio: '16/9' }}
                        >
                          <img
                            src={imgPath}
                            alt="Background"
                            onClick={() => setBackgroundImage(imgPath)}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              border: backgroundImage === imgPath ? '2px solid var(--color-amber-primary)' : '2px solid rgba(255,255,255,0.1)',
                              transition: 'border-color 0.2s',
                            }}
                          />
                          {/* Delete button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteBackground(imgPath); }}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(239,68,68,0.85)',
                              border: 'none',
                              borderRadius: '2px',
                              color: '#fff',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                            }}
                          >✕</button>
                          {backgroundImage === imgPath && (
                            <div style={{
                              position: 'absolute',
                              bottom: '4px',
                              left: '4px',
                              background: 'var(--color-amber-primary)',
                              color: '#000',
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '2px 5px',
                              borderRadius: '2px',
                              fontFamily: 'var(--font-mono)',
                            }}>ATIVO</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Tactical Entity Editor Modal */}
      <EntityEditorModal
        isOpen={editorState.isOpen}
        type={editorState.type}
        initialData={editorState.data}
        onClose={() => setEditorState((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleSaveEntity}
      />
    </div>
  );
};
