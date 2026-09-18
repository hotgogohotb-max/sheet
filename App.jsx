import React, { useState, useEffect } from 'react';
import { Send, Plus, Minus, RotateCcw } from 'lucide-react';

// 동일한 GAS URL 적용
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwbGhMkA5RYyBeeV8rdIjAYYTmz4msatck8GE8oWbFxHn_1Z2sHOodUh2-HlFThmAc/exec";

const rawNames = ["김광태", "김돈하", "김동현", "김민성", "김상오", "김태진", "김필우", "김한주", "박성수", "박승빈", "박정근", "박종엽", "박종호", "송상규", "심영민", "심현승", "안광빈", "유재민", "유재영", "이대행", "이동민", "이승주", "이정수", "이정혁", "이현우", "이형진", "정인탁", "최건혁", "최진석", "허성찬", "홍석운", "최원석", "홍석재"];

const QuickScoreTracker = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [ourScore, setOurScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [players, setPlayers] = useState(() => {
    return rawNames.map((name, i) => ({ id: i + 1, name, goals: 0, assists: 0 }));
  });

  const updateStat = (id, type, delta) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === id) {
        const newVal = Math.max(0, p[type] + delta);
        return { ...p, [type]: newVal };
      }
      return p;
    }));
  };

  const resetStats = () => {
    if (window.confirm("모든 스탯 데이터를 초기화하시겠습니까?")) {
      setOurScore(0);
      setOpponentScore(0);
      setPlayers(rawNames.map((name, i) => ({ id: i + 1, name, goals: 0, assists: 0 })));
    }
  };

  const sendDataToSheet = async () => {
    const formattedDate = selectedDate.substring(5); // "MM-DD"
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
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans select-none">
      {/* 상단 스코어보드 헤더 */}
      <header className="p-4 bg-slate-800 border-b border-slate-700 shadow-md">
        <div className="flex justify-between items-center mb-3">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="bg-slate-700 text-white text-xs border border-slate-600 rounded px-2 py-1 font-bold"
          />
          <div className="flex gap-2">
            <button onClick={resetStats} className="p-2 bg-slate-700 rounded-lg text-slate-300 active:scale-95">
              <RotateCcw size={16} />
            </button>
            <button onClick={sendDataToSheet} className="px-4 py-1.5 bg-emerald-600 font-bold text-xs rounded-lg flex items-center gap-1 active:scale-95 shadow-lg">
              <Send size={14} /> 전송
            </button>
          </div>
        </div>

        {/* 경기 스코어 표시 */}
        <div className="flex justify-around items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-emerald-400 font-black tracking-wider">우리팀</span>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => setOurScore(Math.max(0, ourScore - 1))} className="w-7 h-7 bg-slate-800 rounded flex items-center justify-center font-bold text-slate-400 active:bg-slate-700">-</button>
              <span className="text-2xl font-black text-emerald-400 w-6 text-center">{ourScore}</span>
              <button onClick={() => setOurScore(ourScore + 1)} className="w-7 h-7 bg-emerald-600 rounded flex items-center justify-center font-bold text-white active:bg-emerald-500">+</button>
            </div>
          </div>

          <span className="text-xl font-black text-slate-600">:</span>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-rose-400 font-black tracking-wider">상대팀</span>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={() => setOpponentScore(Math.max(0, opponentScore - 1))} className="w-7 h-7 bg-slate-800 rounded flex items-center justify-center font-bold text-slate-400 active:bg-slate-700">-</button>
              <span className="text-2xl font-black text-rose-400 w-6 text-center">{opponentScore}</span>
              <button onClick={() => setOpponentScore(opponentScore + 1)} className="w-7 h-7 bg-rose-600 rounded flex items-center justify-center font-bold text-white active:bg-rose-500">+</button>
            </div>
          </div>
        </div>
      </header>

      {/* 선수별 골 / 어시스트 빠른 기록 리스트 */}
      <main className="flex-1 overflow-y-auto p-3 space-y-2">
        {players.map(player => (
          <div key={player.id} className="p-3 bg-slate-800 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <span className="font-bold text-sm w-20 truncate">{player.name}</span>
            
            <div className="flex gap-2">
              {/* 골 버튼 */}
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg h-9 px-2">
                <button onClick={() => updateStat(player.id, 'goals', -1)} className="w-7 h-full text-slate-500 font-bold active:text-white">-</button>
                <div className="px-2 text-center min-w-[36px]">
                  <span className="text-[8px] block text-emerald-500 font-black">GOAL</span>
                  <span className={`text-xs font-black ${player.goals > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{player.goals}</span>
                </div>
                <button onClick={() => updateStat(player.id, 'goals', 1)} className="w-7 h-full text-emerald-400 font-bold active:bg-emerald-950/50 rounded">+</button>
              </div>

              {/* 어시스트 버튼 */}
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg h-9 px-2">
                <button onClick={() => updateStat(player.id, 'assists', -1)} className="w-7 h-full text-slate-500 font-bold active:text-white">-</button>
                <div className="px-2 text-center min-w-[36px]">
                  <span className="text-[8px] block text-blue-500 font-black">ASST</span>
                  <span className={`text-xs font-black ${player.assists > 0 ? 'text-blue-400' : 'text-slate-500'}`}>{player.assists}</span>
                </div>
                <button onClick={() => updateStat(player.id, 'assists', 1)} className="w-7 h-full text-blue-400 font-bold active:bg-blue-950/50 rounded">+</button>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default QuickScoreTracker;