import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, UserCheck, Users, RefreshCw, Plus, Minus, AlertTriangle } from 'lucide-react';

// 구글 앱스 스크립트 웹앱 URL (새 배포 URL을 넣어주세요)
const GAS_URL = "https://script.google.com/macros/s/AKfycbyJAwZD_k69nTmsFftPldcVPWtXfyUqqJIV4PYYeAq6UoPdWaU9D4fz6Kvmb6qBBl0Z/exec";
const GAS_URL2  = "https://script.google.com/macros/s/AKfycbzb-Tr6EnOa5FORkuiP6KrUif5emEzDS_S-XlQMfF_uIS9ZdXs_4XkJG28SXRp034Ed/exec";

export default function QuickScoreTracker() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isLoading, setIsLoading] = useState(false);

  // 디버깅/에러 상태
  const [errorMessage, setErrorMessage] = useState('');
  const [debugLog, setDebugLog] = useState(null);

  // 시트 데이터 상태
  const [players, setPlayers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [stats, setStats] = useState({});
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [filterMode, setFilterMode] = useState('attendance');

  useEffect(() => {
    fetchDateData(selectedDate);
  }, [selectedDate]);

  const fetchDateData = async (date) => {
    setErrorMessage('');
    setDebugLog(null);

    if (!GAS_URL || GAS_URL.includes("YOUR_ACTUAL_DEPLOYMENT_ID")) {
      setErrorMessage("오류: GAS_URL이 초기값 상태입니다. 실제 구글 앱스 스크립트 웹앱 URL로 교체해주세요.");
      return;
    }

    setIsLoading(true);
    const targetUrl = `${GAS_URL}?action=load&date=${encodeURIComponent(date)}`;

    try {
      const res = await fetch(targetUrl);

      if (!res.ok) {
        throw new Error(`HTTP 응답 에러 (상태코드: ${res.status} ${res.statusText})`);
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`JSON 파싱 실패 (응답 내용: ${text.substring(0, 100)}...)`);
      }

      setDebugLog(data); // 응답 데이터 보관

      if (data.result === 'error') {
        throw new Error(`GAS 스크립트 오류: ${data.message || '알 수 없는 오류'}`);
      }

      const loadedPlayers = data.players || [];
      setPlayers(loadedPlayers);

      const newAtt = {};
      const newStats = {};
      loadedPlayers.forEach(p => {
        if (p.isAttended !== undefined) {
          newAtt[p.name] = p.isAttended;
        } else {
          newAtt[p.name] = true;
        }
        newStats[p.name] = { goals: p.goals || 0, assists: p.assists || 0 };
      });

      setAttendance(newAtt);
      setStats(newStats);
      if (data.score) setScore(data.score);

      if (loadedPlayers.length === 0) {
        setErrorMessage("알림: 응답은 성공했으나 불러온 선수 목록(players)이 0명입니다. (시트 B열 11행 이하 확인 필요)");
      }

    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setErrorMessage(`[로딩 에러] ${err.message}`);
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

  const handleSaveData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const statsPayload = [];
      Object.keys(attendance).forEach(name => {
        statsPayload.push({
          name: name,
          type: 'attendance',
          value: attendance[name] ? 'O' : ''
        });

        if (stats[name]) {
          statsPayload.push({ name: name, type: 'goal', value: stats[name].goals || 0 });
          statsPayload.push({ name: name, type: 'assist', value: stats[name].assists || 0 });
        }
      });

      const payload = {
        date: selectedDate,
        score: score,
        stats: statsPayload
      };

      const saveUrl = `${GAS_URL}?action=save&data=${encodeURIComponent(JSON.stringify(payload))}`;
      const res = await fetch(saveUrl);
      const text = await res.text();
      const data = JSON.parse(text);

      if (data.result === 'success') {
        alert('성공적으로 저장되었습니다!');
      } else {
        throw new Error(`저장 오류: ${data.message}`);
      }
    } catch (err) {
      setErrorMessage(`[저장 에러] ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const attendedCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-2 sm:p-4 max-w-md mx-auto font-sans pb-28">
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

        {/* 경기 스코어 입력 */}
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

      {/* 2. 에러 메시지 출력 상자 */}
      {errorMessage && (
        <div className="bg-rose-950/80 border border-rose-500/80 rounded-xl p-3 mb-3 text-xs text-rose-200">
          <div className="flex items-center space-x-1.5 font-bold mb-1 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>연동 디버그 에러</span>
          </div>
          <p className="whitespace-pre-wrap break-all">{errorMessage}</p>
        </div>
      )}

      {/* 3. 로딩 및 디버그 로그 */}
      {isLoading && (
        <div className="text-center py-4 text-slate-400 text-xs">
          구글 시트 데이터를 로딩 중입니다...
        </div>
      )}

      {/* 4. 선수 명단 (3열 초밀집 그리드) */}
      <div className="grid grid-cols-3 gap-1.5">
        {players
          .filter(p => filterMode !== 'attended' || attendance[p.name])
          .map((p) => {
            const name = p.name;
            const isAttended = !!attendance[name];
            const userStat = stats[name] || { goals: 0, assists: 0 };

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

            return (
              <div
                key={name}
                className={`p-1.5 rounded-lg border text-center bg-slate-800 border-slate-700 flex flex-col justify-between ${
                  !isAttended ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-xs font-bold text-slate-200 truncate">{name}</span>
                  {isAttended && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
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

      {/* 5. 디버그 응답 정보 (개발 확인용) */}
      {debugLog && (
        <div className="mt-4 bg-slate-950 p-2 rounded border border-slate-800 text-[10px] text-slate-400 overflow-x-auto">
          <div className="font-bold text-slate-300 mb-1">RAW 응답 데이터:</div>
          <pre>{JSON.stringify(debugLog, null, 2)}</pre>
        </div>
      )}

      {/* 하단 저장 버튼 */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md px-2">
        <button
          onClick={handleSaveData}
          disabled={isLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-sm text-white disabled:bg-slate-600"
        >
          <span>{selectedDate} 데이터 저장</span>
        </button>
      </div>
    </div>
  );
}