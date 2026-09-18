import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, UserCheck, Users, RefreshCw, Plus, Minus } from 'lucide-react';

// 구글 앱스 스크립트 웹앱 URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbyYlNuZXvVilEaaa1O9PtZ1GbqprGq_eOhRFJpWteUX8LUBJvysBnKVJIse9JuGOW8K/exec";

export default function QuickScoreTracker() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isLoading, setIsLoading] = useState(false);

  const [players, setPlayers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [stats, setStats] = useState({});
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [filterMode, setFilterMode] = useState('attendance');

  useEffect(() => {
    fetchDateData(selectedDate);
  }, [selectedDate]);

  const fetchDateData = async (date) => {
    setIsLoading(true);

    try {
      const targetUrl = `${GAS_URL}?action=load&date=${encodeURIComponent(date)}`;
      const res = await fetch(targetUrl, { method: 'GET', redirect: 'follow' });
      const text = await res.text();
      const data = JSON.parse(text);

      if (data.result === 'success' || data.result === 'empty') {
        const loadedPlayers = data.players || [];
        setPlayers(loadedPlayers);

        const newAtt = {};
        const newStats = {};
        loadedPlayers.forEach(p => {
          // 데이터가 없거나 false면 미참석(해제)을 기본값으로 지정
          newAtt[p.name] = p.isAttended === true;
          newStats[p.name] = { goals: p.goals || 0, assists: p.assists || 0 };
        });

        setAttendance(newAtt);
        setStats(newStats);
        if (data.score) {
          setScore(data.score);
        } else {
          setScore({ home: 0, away: 0 });
        }
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAttendance = (name) => {
    setAttendance(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const updateStat = (name, type, delta) => {
    setStats(prev => {
      const userStat = prev[name] || { goals: 0, assists: 0 };
      const currentVal = userStat[type] || 0;
      return {
        ...prev,
        [name]: { ...userStat, [type]: Math.max(0, currentVal + delta) }
      };
    });
  };

  // 참석 체크된 인원 기준 데이터 저장
  const handleSaveData = async () => {
    setIsLoading(true);
    try {
      const statsPayload = [];

      Object.keys(attendance).forEach(name => {
        if (attendance[name]) {
          const userStat = stats[name] || { goals: 0, assists: 0 };
          statsPayload.push({
            name: name,
            attendance: true,
            goal: userStat.goals || 0,
            assist: userStat.assists || 0
          });
        }
      });

      const payload = {
        date: selectedDate,
        score: score,
        stats: statsPayload
      };

      const saveUrl = `${GAS_URL}?action=save&data=${encodeURIComponent(JSON.stringify(payload))}`;
      const res = await fetch(saveUrl, { method: 'GET', redirect: 'follow' });
      const text = await res.text();
      const data = JSON.parse(text);

      if (data.result === 'success') {
        alert('구글 시트에 참석자 데이터가 저장되었습니다!');
      } else {
        alert('저장 실패: ' + data.message);
      }
    } catch (err) {
      alert('저장 중 오류 발생: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const attendedCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-2 sm:p-4 max-w-md mx-auto font-sans pb-24">
      {/* 1. 상단 컨트롤러 */}
      <div className="bg-slate-800 rounded-xl p-3 mb-3 shadow-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-700 text-white font-bold text-sm rounded-lg px-2 py-1 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button 
            onClick={() => fetchDateData(selectedDate)}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 경기 스코어 */}
        <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg mb-2">
          <span className="text-xs font-bold text-slate-300">경기 스코어</span>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-emerald-400">우리</span>
            <input
              type="number"
              value={score.home}
              onChange={(e) => setScore({ ...score, home: parseInt(e.target.value) || 0 })}
              className="w-10 bg-slate-800 text-center font-bold text-sm rounded border border-slate-600 py-0.5 text-white"
            />
            <span className="text-xs font-bold">:</span>
            <input
              type="number"
              value={score.away}
              onChange={(e) => setScore({ ...score, away: parseInt(e.target.value) || 0 })}
              className="w-10 bg-slate-800 text-center font-bold text-sm rounded border border-slate-600 py-0.5 text-white"
            />
            <span className="text-xs text-rose-400">상대</span>
          </div>
        </div>

        {/* 필터 탭 */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/60 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilterMode('attendance')}
            className={`py-1.5 rounded-md flex items-center justify-center space-x-1 ${
              filterMode === 'attendance' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>출석체크 ({attendedCount})</span>
          </button>
          <button
            onClick={() => setFilterMode('attended')}
            className={`py-1.5 rounded-md flex items-center justify-center space-x-1 ${
              filterMode === 'attended' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>참석자만</span>
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`py-1.5 rounded-md flex items-center justify-center space-x-1 ${
              filterMode === 'all' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>전체보기</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-6 text-slate-400 text-xs">
          구글 시트 동기화 중...
        </div>
      )}

      {/* 2. 선수 명단 (3열 그리드) */}
      <div className="grid grid-cols-3 gap-1.5">
        {players
          .filter(p => filterMode !== 'attended' || attendance[p.name])
          .map((p) => {
            const name = p.name;
            const isAttended = !!attendance[name];
            const userStat = stats[name] || { goals: 0, assists: 0 };

            // 1) 출석체크 탭
            if (filterMode === 'attendance') {
              return (
                <button
                  key={name}
                  onClick={() => toggleAttendance(name)}
                  className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                    isAttended
                      ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-500'
                  }`}
                >
                  <span className="text-sm font-bold truncate w-full">{name}</span>
                  <span className={`text-[10px] mt-0.5 px-1.5 py-0.5 rounded ${
                    isAttended ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'bg-slate-700 text-slate-500'
                  }`}>
                    {isAttended ? '참석' : '미참석'}
                  </span>
                </button>
              );
            }

            // 2) 전체보기 탭 (누적 토탈 골/어시)
            if (filterMode === 'all') {
              return (
                <div
                  key={name}
                  className="p-2 rounded-lg border text-center bg-slate-800/90 border-slate-700 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between px-0.5 mb-1">
                    <span className="text-xs font-bold text-slate-100 truncate">{name}</span>
                    {isAttended && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                  </div>
                  <div className="bg-slate-900/90 p-1.5 rounded text-[11px] space-y-0.5">
                    <div className="flex justify-between text-amber-400 font-semibold">
                      <span>누적 골</span>
                      <span>{p.totalGoals || 0}</span>
                    </div>
                    <div className="flex justify-between text-sky-400 font-semibold">
                      <span>누적 어시</span>
                      <span>{p.totalAssists || 0}</span>
                    </div>
                  </div>
                </div>
              );
            }

            // 3) 참석자만 탭 (당일 골/어시 조작)
            return (
              <div
                key={name}
                className="p-1.5 rounded-lg border text-center bg-slate-800 border-slate-700 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-xs font-bold text-slate-200 truncate">{name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>

                <div className="mt-1 space-y-1 bg-slate-900/80 p-1 rounded">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-amber-400 font-semibold">골 {userStat.goals || 0}</span>
                    <div className="flex space-x-0.5">
                      <button
                        onClick={() => updateStat(name, 'goals', -1)}
                        className="w-4 h-4 bg-slate-700 rounded flex items-center justify-center text-slate-300"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => updateStat(name, 'goals', 1)}
                        className="w-4 h-4 bg-amber-600 rounded flex items-center justify-center text-white"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-sky-400 font-semibold">어시 {userStat.assists || 0}</span>
                    <div className="flex space-x-0.5">
                      <button
                        onClick={() => updateStat(name, 'assists', -1)}
                        className="w-4 h-4 bg-slate-700 rounded flex items-center justify-center text-slate-300"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => updateStat(name, 'assists', 1)}
                        className="w-4 h-4 bg-sky-600 rounded flex items-center justify-center text-white"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* 하단 저장 버튼 */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md px-2">
        <button
          onClick={handleSaveData}
          disabled={isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-sm text-white disabled:bg-slate-600"
        >
          <span>{selectedDate} 참석자 데이터 저장</span>
        </button>
      </div>
    </div>
  );
}