// src/components/LegislationQuarterModal.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Landmark,
  Building,
  FileText,
  Vote,
  Filter,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  ChevronRight
} from 'lucide-react';
import {
  MOCK_CONGRESS_AND_LEGISCAN_PAYLOAD,
  buildMockStateLegislativeQuarter,
  POLICY_DOMAINS
} from '../data/legislationData';

function PartyPill({ party }) {
  const code = party || 'I';
  const cls =
    code === 'D'
      ? 'party-badge dem'
      : code === 'R'
      ? 'party-badge rep'
      : code === 'Split'
      ? 'party-badge split'
      : 'party-badge ind';
  const label =
    code === 'D'
      ? 'Democrat (D)'
      : code === 'R'
      ? 'Republican (R)'
      : code === 'Split'
      ? 'Split Government'
      : 'Independent (I)';
  return <span className={cls}>{label}</span>;
}

export function LegislationQuarterModal({
  quarterKey,
  focusCity,
  hasLiveLegApi,
  onClose
}) {
  const [govLevel, setGovLevel] = useState('federal'); // 'federal' | 'state'
  const [domainFilter, setDomainFilter] = useState('All Domains');
  const [selectedBillId, setSelectedBillId] = useState(null);

  useEffect(() => {
    setSelectedBillId(null);
  }, [quarterKey, govLevel]);

  const quarterData = useMemo(() => {
    const qKeys = Object.keys(MOCK_CONGRESS_AND_LEGISCAN_PAYLOAD.quarters);
    const matchedQ =
      MOCK_CONGRESS_AND_LEGISCAN_PAYLOAD.quarters[quarterKey] ||
      MOCK_CONGRESS_AND_LEGISCAN_PAYLOAD.quarters[qKeys[qKeys.length - 1]];
    const statePack = buildMockStateLegislativeQuarter(
      focusCity,
      quarterKey || matchedQ.quarter
    );
    return { matchedQ, statePack };
  }, [quarterKey, focusCity]);

  if (!quarterKey) return null;

  const { matchedQ, statePack } = quarterData;
  const activeBills =
    govLevel === 'federal' ? matchedQ.federalBills : statePack.stateBills;

  const filteredBills = activeBills.filter((b) =>
    domainFilter === 'All Domains' ? true : b.domain === domainFilter
  );

  const selectedBill = selectedBillId
    ? activeBills.find((b) => b.id === selectedBillId) || null
    : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card leg-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <h3>
              Quarterly Power & Legislation: {matchedQ.quarter}
              {govLevel === 'state' && focusCity
                ? ` • ${focusCity.city}, ${focusCity.state}`
                : ' • U.S. Federal'}
            </h3>
            <p className="modal-sub">
              {hasLiveLegApi
                ? 'Live Legislative & Roster APIs Connected'
                : 'Demo Mode: Showing API-shaped mock data (Congress.gov, Open States v3, LegiScan & @unitedstates) until keys are added'}
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose}>
            <X size={16} /> Close
          </button>
        </div>

        {/* If a specific bill is clicked, display full Bill Details & Yea/Nay Roll-Call Votes */}
        {selectedBill ? (
          <div className="bill-detail-view">
            <div className="bill-detail-topbar">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedBillId(null)}
              >
                <ArrowLeft size={15} /> Back to {matchedQ.quarter} Bills
              </button>
              <div className="bill-detail-badges">
                <span className="city-code-badge">
                  {selectedBill.bill_number || selectedBill.identifier}
                </span>
                <span className="domain-pill">{selectedBill.domain}</span>
                <span className="outcome-tag">{selectedBill.outcome}</span>
              </div>
            </div>

            <div className="bill-detail-header-card">
              <h4>{selectedBill.title}</h4>
              <p className="bill-summary-text">{selectedBill.summary}</p>
              <div className="bill-impact-callout">
                <strong>Cost-of-Living Impact:</strong> {selectedBill.colImpactNote}
              </div>
              <div className="bill-meta-strip">
                <span>
                  Primary Sponsor: <strong>{selectedBill.sponsor?.name}</strong> (
                  <PartyPill party={selectedBill.sponsor?.party} />)
                </span>
                <span>
                  Executive Action: <strong>{selectedBill.executiveAction || selectedBill.outcome}</strong>
                </span>
                <span>
                  Roll Call ID: <strong>{selectedBill.rollCall?.rollCallId || 'N/A'}</strong> •{' '}
                  <strong>
                    {selectedBill.rollCall?.yea ?? 0} Yea / {selectedBill.rollCall?.nay ?? 0} Nay
                  </strong>
                </span>
              </div>
            </div>

            {/* Side-by-Side Voted For (Yea) vs. Voted Against (Nay) Breakdown */}
            <div className="rollcall-split-grid">
              <div className="rollcall-box yea-box">
                <h5>
                  <ThumbsUp size={15} /> Voted For / Yea ({selectedBill.rollCall?.yea ?? 0} Total)
                </h5>
                <table className="mini-budget-table">
                  <thead>
                    <tr>
                      <th>Legislator</th>
                      <th>Party</th>
                      <th>State / District</th>
                      <th>Standardized ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedBill.rollCall?.yeaVoters || []).map((v, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{v.name}</strong>
                        </td>
                        <td>
                          <PartyPill party={v.party} />
                        </td>
                        <td>{v.state}</td>
                        <td>
                          <code>{v.bioguide_id}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rollcall-box nay-box">
                <h5>
                  <ThumbsDown size={15} /> Voted Against / Nay ({selectedBill.rollCall?.nay ?? 0} Total)
                </h5>
                <table className="mini-budget-table">
                  <thead>
                    <tr>
                      <th>Legislator</th>
                      <th>Party</th>
                      <th>State / District</th>
                      <th>Standardized ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedBill.rollCall?.nayVoters || []).map((v, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{v.name}</strong>
                        </td>
                        <td>
                          <PartyPill party={v.party} />
                        </td>
                        <td>{v.state}</td>
                        <td>
                          <code>{v.bioguide_id}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Federal vs. State Level Toggle + Policy Domain Filter */}
            <div className="leg-controls-row">
              <div className="view-toggle-group">
                <button
                  type="button"
                  className={govLevel === 'federal' ? 'toggle-btn active' : 'toggle-btn'}
                  onClick={() => setGovLevel('federal')}
                >
                  <Landmark size={15} /> <span>Federal Level (POTUS / VP / Congress)</span>
                </button>
                <button
                  type="button"
                  className={govLevel === 'state' ? 'toggle-btn active' : 'toggle-btn'}
                  onClick={() => setGovLevel('state')}
                >
                  <Building size={15} />{' '}
                  <span>State Level ({focusCity?.state || 'State'} Gov & Legislature)</span>
                </button>
              </div>

              <div className="leg-domain-filter">
                <Filter size={14} />
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                >
                  {POLICY_DOMAINS.map((dom) => (
                    <option key={dom} value={dom}>
                      Domain: {dom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Who Was in Power Breakdown */}
            {govLevel === 'federal' ? (
              <div className="power-cards-grid">
                <div className="power-card">
                  <span>President</span>
                  <strong>{matchedQ.federalPower.president.name}</strong>
                  <PartyPill party={matchedQ.federalPower.president.party} />
                </div>
                <div className="power-card">
                  <span>Vice President</span>
                  <strong>{matchedQ.federalPower.vicePresident.name}</strong>
                  <PartyPill party={matchedQ.federalPower.vicePresident.party} />
                </div>
                <div className="power-card">
                  <span>U.S. Senate Majority</span>
                  <strong>
                    {matchedQ.federalPower.senate.rep}R / {matchedQ.federalPower.senate.dem}D
                  </strong>
                  <PartyPill party={matchedQ.federalPower.senate.control} />
                </div>
                <div className="power-card">
                  <span>U.S. House Majority</span>
                  <strong>
                    {matchedQ.federalPower.house.rep}R / {matchedQ.federalPower.house.dem}D
                  </strong>
                  <PartyPill party={matchedQ.federalPower.house.control} />
                </div>
              </div>
            ) : (
              <div className="power-cards-grid">
                <div className="power-card">
                  <span>Governor ({statePack.jurisdiction_id.split(':')[2]?.toUpperCase()})</span>
                  <strong>{statePack.governor.name}</strong>
                  <PartyPill party={statePack.governor.party} />
                  <small>{statePack.governor.executiveAction}</small>
                </div>
                <div className="power-card">
                  <span>State Trifecta Status</span>
                  <strong>
                    {statePack.chamberControl.trifecta === 'Split'
                      ? 'Divided State Government'
                      : `${statePack.chamberControl.trifecta} State Trifecta`}
                  </strong>
                  <PartyPill party={statePack.chamberControl.trifecta} />
                </div>
                <div className="power-card">
                  <span>State Chambers</span>
                  <strong>
                    Sen: {statePack.chamberControl.senate} • House: {statePack.chamberControl.house}
                  </strong>
                  <small>Open States v3 / LegiScan</small>
                </div>
                <div className="power-card">
                  <span>Federal Delegation ({focusCity?.state || 'State'})</span>
                  <strong>{statePack.federalDelegation.senators.length} Senators + Reps</strong>
                  <small>
                    {statePack.federalDelegation.senators
                      .map((s) => `${s.name.split(' ')[0]} (${s.party})`)
                      .join(' • ')}
                  </small>
                </div>
              </div>
            )}

            {/* Clickable Cost-of-Living Legislation List */}
            <div className="budget-table-box">
              <h4>
                <FileText size={15} /> Cost-of-Living Legislation ({filteredBills.length}) — Click any bill for full details & roll-call votes
              </h4>
              <div className="leg-bills-list">
                {filteredBills.map((bill) => {
                  const rc = bill.rollCall || {};
                  return (
                    <button
                      key={bill.id}
                      type="button"
                      className="leg-bill-item clickable-bill-card"
                      onClick={() => setSelectedBillId(bill.id)}
                    >
                      <div className="leg-bill-top">
                        <div>
                          <span className="city-code-badge">
                            {bill.bill_number || bill.identifier}
                          </span>
                          <span className="domain-pill">{bill.domain}</span>
                          <strong>{bill.title}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span className="outcome-tag">{bill.outcome}</span>
                          <span className="expand-link">
                            Votes <ChevronRight size={14} style={{ verticalAlign: 'middle' }} />
                          </span>
                        </div>
                      </div>
                      <div className="leg-bill-meta">
                        <span>
                          Sponsor: <strong>{bill.sponsor?.name}</strong> (
                          <PartyPill party={bill.sponsor?.party} />)
                        </span>
                        <span>
                          <Vote size={13} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                          Roll Call: <strong>{rc.yea} Yea / {rc.nay} Nay</strong>
                        </span>
                        <span>Date: {bill.status_date}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}