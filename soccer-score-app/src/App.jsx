import React, { useState } from 'react';

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwbGhMkA5RYyBeeV8rdIjAYYTmz4msatck8GE8oWbFxHn_1Z2sHOodUh2-HlFThmAc/exec";

const rawNames = ["김광태", "김돈하", "김동현", "김민성", "김상오", "김태진", "김필우", "김한주", "박성수", "박승빈", "박정근", "박종엽", "박종호", "송상규", "심영민", "심현승", "안광빈", "유재민", "유재영", "이대행", "이동민", "이승주", "이정수", "이정혁", "이현우", "이형진", "정인탁", "최건혁", "최진석", "허성찬", "홍석운", "최원석", "홍석재"];

export default function App() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [ourScore, setOurScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [players, setPlayers] = useState(() => rawNames.map((name, i) => ({ id: i + 1, name, goals: 0, assists: 0 })));

  const updateStat = (id, type, delta) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, [type]: Math.max(0, p[type] + delta) } : p));
  };

  const resetStats = () => {
    if (window.confirm("모든 스탯 데이터를 초기화하시겠습니까?")) {
      setOurScore(0);
      setOpponentScore(0);
      setPlayers(rawNames.map((name, i) => ({ id: i + 1, name, goals: 0, assists: 0 })));
    }
  };

  const sendDataToSheet = async () => {
    const formattedDate = selectedDate.substring(5);
    const activePlayers = players.filter(p => p.goals > 0 || p.assists > 0);

    if (activePlayers.length === 0) {
      alert("기록된 골이나 어시스트가 없습니다.");
      return;
    }

    const payload = activePlayers.flatMap(p => [
      { name: p.name, date: formattedDate, type: "goal", value: p.goals },
      { name: p.name, date: formattedDate, type: "assist", value: p.assists }
    ]).filter(item => item.value > 0);

    try {
      await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
      });
      alert(`${formattedDate} 스탯 기록 전송 완료!`);
    } catch (e) {
      alert("전송 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#fff', minHeight: '100vh', padding: '16px', fontFamily: 'sans-serif' }}>
      {/* 상단 컨트롤 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ backgroundColor: '#334155', color: '#fff', border: '1px solid #475569', borderRadius: '6px', padding: '6px 10px', fontSize: '14px' }}
        />
        <div>
          <button onClick={resetStats} style={{ backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 12px', marginRight: '8px', cursor: 'pointer' }}>초기화</button>
          <button onClick={sendDataToSheet} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>시트 전송</button>
        </div>
      </div>

      {/* 스코어보드 */}
      <div style={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#34d399', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>우리팀</div>
          <button onClick={() => setOurScore(Math.max(0, ourScore - 1))} style={{ width: '32px', height: '32px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}>-</button>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#34d399', margin: '0 12px' }}>{ourScore}</span>
          <button onClick={() => setOurScore(ourScore + 1)} style={{ width: '32px', height: '32px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px' }}>+</button>
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#475569' }}>:</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#f87171', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>상대팀</div>
          <button onClick={() => setOpponentScore(Math.max(0, opponentScore - 1))} style={{ width: '32px', height: '32px', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px' }}>-</button>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f87171', margin: '0 12px' }}>{opponentScore}</span>
          <button onClick={() => setOpponentScore(opponentScore + 1)} style={{ width: '32px', height: '32px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px' }}>+</button>
        </div>
      </div>

      {/* 선수 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {players.map(p => (
          <div key={p.id} style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', width: '80px' }}>{p.name}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* 골 */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 'bold' }}>GOAL</span>
                <button onClick={() => updateStat(p.id, 'goals', -1)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>-</button>
                <span style={{ width: '16px', textAlign: 'center', fontWeight: 'bold', color: p.goals > 0 ? '#34d399' : '#64748b' }}>{p.goals}</span>
                <button onClick={() => updateStat(p.id, 'goals', 1)} style={{ background: 'none', border: 'none', color: '#34d399', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
              </div>
              {/* 어시스트 */}
              <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: 'bold' }}>ASST</span>
                <button onClick={() => updateStat(p.id, 'assists', -1)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>-</button>
                <span style={{ width: '16px', textAlign: 'center', fontWeight: 'bold', color: p.assists > 0 ? '#60a5fa' : '#64748b' }}>{p.assists}</span>
                <button onClick={() => updateStat(p.id, 'assists', 1)} style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}