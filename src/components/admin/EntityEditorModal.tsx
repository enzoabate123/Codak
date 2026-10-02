'use client';

import React, { useState, useEffect } from 'react';
import { Weapon, Attachment, WeaponSize, WeaponType, ActionCost } from '@/types/codak-rules';
import { ClassDefinition } from '@/data/classes-catalog';
import { ClassAbilityDetail } from '@/data/class-abilities-catalog';
import { LoreRuleItem } from '@/data/lore-rules-catalog';
import { X, Save, AlertTriangle } from 'lucide-react';
import { tacticalAudio } from '@/lib/audio';

export type EditableEntityType = 'weapon' | 'attachment' | 'ability' | 'class' | 'lore_rule';

interface EntityEditorModalProps {
  isOpen: boolean;
  type: EditableEntityType;
  initialData?: any;
  onClose: () => void;
  onSave: (type: EditableEntityType, data: any) => Promise<void>;
}

export const EntityEditorModal: React.FC<EntityEditorModalProps> = ({
  isOpen,
  type,
  initialData,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = Boolean(initialData && (initialData.id || initialData.type));

  useEffect(() => {
    if (initialData) {
      setFormData(structuredClone(initialData));
    } else {
      // Default empty structure by type
      switch (type) {
        case 'weapon':
          setFormData({
            id: `w-${Date.now().toString(36)}`,
            name: '',
            type: 'Rifle',
            size: 'Medium',
            cost: 1000,
            baseDamage: '1d8',
            sweetSpot: 20,
            sweetSpotBonusDamage: '+2',
            ammoCapacity: 30,
            burstRate: 3,
            rechargeCost: '1 Ação',
            attachmentSlots: 3,
            equippedAttachments: [],
          });
          break;
        case 'attachment':
          setFormData({
            id: `att-${Date.now().toString(36)}`,
            name: '',
            category: 'Mira',
            slots: 1,
            price: 500,
            effect: '',
            compatibility: { all: true },
          });
          break;
        case 'ability':
          setFormData({
            id: `hab-custom-${Date.now().toString(36)}`,
            code: 'HAB',
            name: '',
            className: 'Ancient',
            classId: 'ancient',
            level: 1,
            actionCost: 'Ação',
            usageLimit: 'Descanso Curto',
            range: '12m',
            summary: '',
            description: '',
            rules: ['Efeito mecânico da habilidade'],
            tacticalTip: '',
            tags: ['custom'],
          });
          break;
        case 'class':
          setFormData({
            id: `cls-custom-${Date.now().toString(36)}`,
            name: '',
            code: '07',
            tagline: '',
            hitDice: '1d10',
            hitPointsLevel1: '10 + CON',
            savingThrows: ['DEX', 'CON'],
            keyStats: 'DEX, CON',
            weaponProficiencies: ['Armas Leves'],
            armorProficiencies: ['Armaduras Leves'],
            skillsText: 'Escolha 2 entre Atletismo, Percepção...',
            classFeatures: [],
            progression: [],
            subclasses: [],
          });
          break;
        case 'lore_rule':
          setFormData({
            id: `lore-custom-${Date.now().toString(36)}`,
            code: 'LORE',
            category: 'regras',
            title: '',
            subtitle: '',
            summary: '',
            description: '',
            attributes: [],
            tags: ['custom'],
          });
          break;
      }
    }
    setFormError(null);
  }, [initialData, type, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name && !formData.title) {
      setFormError('Informe o nome ou título do registro.');
      tacticalAudio.playAlert();
      return;
    }
    try {
      setIsSubmitting(true);
      await onSave(type, formData);
      tacticalAudio.playSelect();
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar registro.');
      tacticalAudio.playAlert();
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: val }));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="hud-panel-chamfer"
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(12, 12, 16, 0.98)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: 'var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(239, 68, 68, 0.08)',
          }}
        >
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-amber-primary)', fontWeight: 800 }}>
              {isEditing ? '[ EDITAR REGISTRO EXISTENTE ]' : '[ CRIAR NOVO REGISTRO TÁTICO ]'}
            </span>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 900, color: '#fff', margin: '2px 0 0 0' }}>
              {type.toUpperCase()}: {formData.name || formData.title || 'Sem Título'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hud-btn hud-btn-ghost"
            style={{ padding: '6px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                borderLeft: '3px solid var(--color-red-primary)',
                color: '#fca5a5',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={15} color="#ef4444" />
              <span>{formError}</span>
            </div>
          )}

          {/* WEAPON FIELDS */}
          {type === 'weapon' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>NOME DO ARMAMENTO:</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>IDENTIFICADOR (ID ÚNICO):</label>
                <input
                  type="text"
                  value={formData.id || ''}
                  disabled={isEditing}
                  onChange={(e) => updateField('id', e.target.value)}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px', opacity: isEditing ? 0.6 : 1 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>CATEGORIA:</label>
                <select
                  value={formData.type || 'Rifle'}
                  onChange={(e) => updateField('type', e.target.value)}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                >
                  {['Pistol', 'SMG', 'Rifle', 'Shotgun', 'Sniper', 'LMG', 'Energy'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>PORTE:</label>
                <select
                  value={formData.size || 'Medium'}
                  onChange={(e) => updateField('size', e.target.value)}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                >
                  <option value="Small">Small (Pequeno)</option>
                  <option value="Medium">Medium (Médio)</option>
                  <option value="Big">Big (Grande/Pesado)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>DANO BASE:</label>
                <input
                  type="text"
                  value={formData.baseDamage || ''}
                  onChange={(e) => updateField('baseDamage', e.target.value)}
                  placeholder="Ex: 1d8, 2d6, 1d12"
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>SWEET SPOT (METROS):</label>
                <input
                  type="number"
                  value={formData.sweetSpot || 15}
                  onChange={(e) => updateField('sweetSpot', Number(e.target.value))}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>BÔNUS DE SWEET SPOT:</label>
                <input
                  type="text"
                  value={formData.sweetSpotBonusDamage || ''}
                  onChange={(e) => updateField('sweetSpotBonusDamage', e.target.value)}
                  placeholder="Ex: +2, +1d4"
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>CAPACIDADE DO PENTE:</label>
                <input
                  type="number"
                  value={formData.ammoCapacity || 30}
                  onChange={(e) => updateField('ammoCapacity', Number(e.target.value))}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>CADÊNCIA / RAJADA:</label>
                <input
                  type="number"
                  value={formData.burstRate || 3}
                  onChange={(e) => updateField('burstRate', Number(e.target.value))}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>CUSTO DE RECARGA:</label>
                <input
                  type="text"
                  value={formData.rechargeCost || '1 Ação'}
                  onChange={(e) => updateField('rechargeCost', e.target.value)}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>SLOTS DE ATTACHMENT:</label>
                <input
                  type="number"
                  value={formData.attachmentSlots || 3}
                  onChange={(e) => updateField('attachmentSlots', Number(e.target.value))}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>VALOR DE MERCADO (CRÉDITOS ₵):</label>
                <input
                  type="number"
                  value={formData.cost || 1000}
                  onChange={(e) => updateField('cost', Number(e.target.value))}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                />
              </div>
            </div>
          )}

          {/* ATTACHMENT FIELDS */}
          {type === 'attachment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>NOME DO COMPONENTE:</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>CATEGORIA:</label>
                  <select
                    value={formData.category || 'Mira'}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  >
                    {['Mira', 'Cano', 'Coronha', 'Carregador', 'Grip'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>SLOTS REQUERIDOS:</label>
                  <input
                    type="number"
                    value={formData.slots || 1}
                    onChange={(e) => updateField('slots', Number(e.target.value))}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>PREÇO (₵):</label>
                  <input
                    type="number"
                    value={formData.price || 500}
                    onChange={(e) => updateField('price', Number(e.target.value))}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>EFEITO TÁTICO:</label>
                <textarea
                  value={formData.effect || ''}
                  onChange={(e) => updateField('effect', e.target.value)}
                  rows={3}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={formData.compatibility?.all ?? true}
                    onChange={(e) => updateField('compatibility', { ...formData.compatibility, all: e.target.checked })}
                  />
                  <span>Compatibilidade Universal (Permitido em todas as armas)</span>
                </label>
              </div>
            </div>
          )}

          {/* ABILITY FIELDS */}
          {type === 'ability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>NOME DA HABILIDADE:</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>CLASSE DE ORIGEM:</label>
                  <input
                    type="text"
                    value={formData.className || ''}
                    onChange={(e) => updateField('className', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>CUSTO DE AÇÃO:</label>
                  <select
                    value={formData.actionCost || 'Ação'}
                    onChange={(e) => updateField('actionCost', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  >
                    {['Ação', 'Ação Bônus', 'Reação', 'Passiva', 'Ação de Movimento'].map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>NÍVEL REQUERIDO:</label>
                  <input
                    type="number"
                    value={formData.level || 1}
                    onChange={(e) => updateField('level', Number(e.target.value))}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>ALCANCE / ÁREA:</label>
                  <input
                    type="text"
                    value={formData.range || 'Pessoal'}
                    onChange={(e) => updateField('range', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>RECARGA / USOS:</label>
                <input
                  type="text"
                  value={formData.usageLimit || 'Sem limite'}
                  onChange={(e) => updateField('usageLimit', e.target.value)}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>RESUMO TÁTICO (SINOPSE):</label>
                <input
                  type="text"
                  value={formData.summary || ''}
                  onChange={(e) => updateField('summary', e.target.value)}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>DETALHAMENTO MECÂNICO COMPLETO:</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px', resize: 'vertical' }}
                  required
                />
              </div>
            </div>
          )}

          {/* LORE / RULE FIELDS */}
          {type === 'lore_rule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>TÍTULO:</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>CATEGORIA:</label>
                  <select
                    value={formData.category || 'regras'}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  >
                    <option value="regras">Regras de Combate</option>
                    <option value="infecoes">Infecções & Lore</option>
                    <option value="racas">Raças</option>
                    <option value="equipamentos">Equipamentos</option>
                    <option value="regioes">Regiões & Materiais</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>SUBTÍTULO:</label>
                <input
                  type="text"
                  value={formData.subtitle || ''}
                  onChange={(e) => updateField('subtitle', e.target.value)}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>RESUMO / SINOPSE:</label>
                <input
                  type="text"
                  value={formData.summary || ''}
                  onChange={(e) => updateField('summary', e.target.value)}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>DESCRIÇÃO COMPLETA:</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={5}
                  className="hud-input"
                  style={{ width: '100%', padding: '8px', fontSize: '12px', resize: 'vertical' }}
                  required
                />
              </div>
            </div>
          )}

          {/* CLASS FIELDS */}
          {type === 'class' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>NOME DA CLASSE:</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>SLOGAN / TAGLINE:</label>
                  <input
                    type="text"
                    value={formData.tagline || ''}
                    onChange={(e) => updateField('tagline', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>DADO DE VIDA:</label>
                  <input
                    type="text"
                    value={formData.hitDice || '1d10'}
                    onChange={(e) => updateField('hitDice', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>PONTOS DE VIDA NV 1:</label>
                  <input
                    type="text"
                    value={formData.hitPointsLevel1 || '10 + CON'}
                    onChange={(e) => updateField('hitPointsLevel1', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '4px' }}>ATRIBUTOS-CHAVE:</label>
                  <input
                    type="text"
                    value={formData.keyStats || 'STR, CON'}
                    onChange={(e) => updateField('keyStats', e.target.value)}
                    className="hud-input"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '16px',
              marginTop: '8px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="hud-btn hud-btn-outline"
              style={{ padding: '8px 16px', fontSize: '11px' }}
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="hud-btn hud-btn-primary"
              style={{ padding: '8px 20px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={14} />
              <span>{isSubmitting ? 'SALVANDO...' : 'CONFIRMAR & SALVAR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
