'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { InventoryItem, useCharacterStore } from '@/stores/useCharacterStore';
import { tacticalAudio } from '@/lib/audio';

const types = [
  ['weapon', 'Arma'],
  ['armor', 'Armadura'],
  ['accessory', 'Acessório'],
  ['item', 'Equipamento'],
] as const;

export const ManualInventoryControls: React.FC = () => {
  const { characters, activeCharacterId, updateCredits, fetchCharacters } = useCharacterStore();
  const { user } = useAuthStore();
  const char = characters.find(character => character.id === activeCharacterId);
  const [creditDelta, setCreditDelta] = useState('');
  const [itemType, setItemType] = useState<InventoryItem['type']>('item');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [damage, setDamage] = useState('1d6');
  const [armorBonus, setArmorBonus] = useState('0');
  const [message, setMessage] = useState('');

  if (!char) return null;
  const isAdmin = user?.role === 'admin';
  const pending = (char.pendingEquipmentRequests || []).filter(request => request.status === 'pending');

  const addCredits = () => {
    const value = Number(creditDelta);
    if (!Number.isFinite(value) || value === 0) return;
    updateCredits(value);
    setCreditDelta('');
    tacticalAudio.playSelect();
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const item: Omit<InventoryItem, 'id'> = {
      name: name.trim(),
      quantity: Math.max(1, Math.floor(Number(quantity) || 1)),
      weight: '—',
      notes: notes.trim(),
      type: itemType,
    };
    if (itemType === 'armor') item.bonusAttributes = { AC: Number(armorBonus) || 0 } as any;
    if (itemType === 'weapon') {
      item.data = {
        id: `custom-${Date.now()}`,
        name: item.name,
        type: 'Rifle',
        size: 'Medium',
        cost: 0,
        sweetSpot: 0,
        baseDamage: damage || '1d6',
        sweetSpotBonusDamage: '0',
        ammoCapacity: 0,
        currentAmmo: 0,
        burstRate: '1x1',
        rechargeCost: '1A',
        attachmentSlots: 0,
      };
    }

    setMessage('Enviando para aprovação…');
    const response = await fetch('/api/equipment-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: char.id, item }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || 'Não foi possível enviar a solicitação.');
      return;
    }
    setName(''); setQuantity('1'); setNotes(''); setMessage('Solicitação enviada ao mestre.');
    tacticalAudio.playSelect();
    await fetchCharacters();
  };

  const decide = async (requestId: string, decision: 'approved' | 'rejected') => {
    setMessage('Salvando decisão…');
    const response = await fetch('/api/equipment-requests', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: char.id, requestId, decision }),
    });
    const result = await response.json();
    setMessage(response.ok ? (decision === 'approved' ? 'Item aprovado e adicionado ao inventário.' : 'Solicitação recusada.') : (result.error || 'Falha ao salvar decisão.'));
    if (response.ok) tacticalAudio.playSelect();
    await fetchCharacters();
  };

  return (
    <div className="hud-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-amber-primary)', fontWeight: 800 }}>CRÉDITOS E SOLICITAÇÕES</div>
      <div style={{ display: 'flex', alignItems: 'end', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>CRÉDITOS NO INVENTÁRIO: {char.credits ?? 0}</div>
          <input type="number" value={creditDelta} onChange={event => setCreditDelta(event.target.value)} className="hud-input" placeholder="+ ou - valor" style={{ width: '100%' }} />
        </div>
        <button type="button" onClick={addCredits} className="hud-btn hud-btn-outline" style={{ padding: '7px 10px', fontSize: '10px' }}>APLICAR</button>
      </div>

      {!isAdmin && (
        <form onSubmit={submitRequest} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
          <div style={{ gridColumn: 'span 2', fontSize: '10px', color: 'var(--text-muted)' }}>CRIAR ARMA OU EQUIPAMENTO — precisa de aprovação do mestre</div>
          <select value={itemType} onChange={event => setItemType(event.target.value as InventoryItem['type'])} className="hud-input">
            {types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input value={name} onChange={event => setName(event.target.value)} className="hud-input" placeholder="Nome" required />
          <input type="number" min="1" value={quantity} onChange={event => setQuantity(event.target.value)} className="hud-input" placeholder="Quantidade" />
          {itemType === 'weapon' && <input value={damage} onChange={event => setDamage(event.target.value)} className="hud-input" placeholder="Dano base (ex.: 2d6)" />}
          {itemType === 'armor' && <input type="number" value={armorBonus} onChange={event => setArmorBonus(event.target.value)} className="hud-input" placeholder="Bônus de CA" />}
          <input value={notes} onChange={event => setNotes(event.target.value)} className="hud-input" placeholder="Descrição / observações" style={{ gridColumn: 'span 2' }} />
          <button type="submit" className="hud-btn hud-btn-primary" style={{ gridColumn: 'span 2', fontSize: '10px', padding: '7px' }}>ENVIAR PARA APROVAÇÃO</button>
        </form>
      )}

      {isAdmin && pending.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SOLICITAÇÕES PENDENTES ({pending.length})</div>
          {pending.map(request => (
            <div key={request.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'rgba(245, 158, 11, 0.06)', borderLeft: '2px solid var(--color-amber-primary)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>{request.item.name} ×{request.item.quantity}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{request.item.type} · {request.item.notes || 'sem observações'}</div>
              </div>
              <button type="button" onClick={() => decide(request.id, 'approved')} className="hud-btn hud-btn-primary" style={{ padding: '4px 6px', fontSize: '9px' }}>APROVAR</button>
              <button type="button" onClick={() => decide(request.id, 'rejected')} className="hud-btn hud-btn-ghost" style={{ padding: '4px 6px', fontSize: '9px', color: 'var(--color-red-primary)' }}>RECUSAR</button>
            </div>
          ))}
        </div>
      )}
      {message && <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{message}</div>}
    </div>
  );
};
