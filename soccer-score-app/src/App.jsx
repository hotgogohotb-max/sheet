import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle2, UserCheck, Users, RefreshCw, Plus, Minus } from 'lucide-react';

// 바이킹 축구팀 전체 명단 예시 (필요시 구글 시트 멤버 연동)
const ALL_MEMBERS = [
  '박성수', '김철수', '이영희', '홍길동', '정민우',
  '최현우', '강동원', '윤서준', '임재범', '한지민',
  '송중기', '배수지', '조인성', '김태리', '남주혁'
];

// 구글 앱스 스크립트 웹앱 URL
const GAS_URL  = "https://script.google.com/macros/s/AKfycbwu39gCSo49ZFWyxgvNuoiw3Np7RvB2HbtfAmRX4uTJ0CF1fvM2BPMVl9pUFgQDG5et/exec";

export default function QuickScoreTracker() {
  // 1. 날짜 상태 (기본값: 오늘 YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isLoading, setIsLoading] = useState(false);

  // 2. 출석 및 필터 상태
  const [attendance, setAttendance] = useState({}); // { '박성수': true, '김철수': false }
  const [filterMode, setFilterMode] = useState('attendance'); // 'all' | 'attended' | 'attendance' (출석체크모드)

  // 3. 경기 기록 상태 (선수별 득점/어시스트)
  const [stats, setStats] = useState({});

  // 날짜 변경 시 해당 날짜 데이터 불러오기
  useEffect(() => {
    fetchDateData(selectedDate);
  }, [selectedDate]);

 const fetchDateData = async (date) => {
    if (!GAS_URL || GAS_URL.includes("YOUR_ACTUAL_DEPLOYMENT_ID")) {
      console.warn("GAS_URL이 설정되지 않았습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${GAS_URL}?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        // 구글 시트에 등록된 명단이 있다면 업데이트
        if (data.members && data.members.length > 0) {
          setMemberList(data.members);
        }
        if (data.attendance) setAttendance(data.attendance);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('구글 시트 데이터 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 출석 토글
  const toggleAttendance = (name) => {
    setAttendance(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // 스탯 변경 (득점/어시스트)
  const updateStat = (name, type, delta) => {
    setStats(prev => {
      const userStat = prev[name] || { goals: 0, assists: 0 };
      const currentVal = userStat[type] || 0;
      const newVal = Math.max(0, currentVal + delta);
      return {
        ...prev,
        [name]: { ...userStat, [type]: newVal }
      };
    });
  };

  // 표시할 멤버 목록 필터링
  const displayedMembers = ALL_MEMBERS.filter(name => {
    if (filterMode === 'attended') return attendance[name] === true;
    return true; // 'all' 또는 'attendance' 모드에서는 전체 출력
  });

  const attendedCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-2 sm:p-4 max-w-md mx-auto font-sans">
      {/* 1. 상단 날짜 및 요약 헤더 */}
      <div className="bg-slate-800 rounded-xl p-3 mb-2 shadow-lg border border-slate-700">
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

        {/* 탭/필터 버튼 (모바일 밀도 최적화) */}
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

      {/* 2. 모바일 초밀집 멤버 리스트 그리드 (3열 출력) */}
      <div className="grid grid-cols-3 gap-1.5 mb-16">
        {displayedMembers.map((name) => {
          const isAttended = !!attendance[name];
          const userStat = stats[name] || { goals: 0, assists: 0 };

          // 출석 체크 모드일 때의 카드
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

          // 경기 스탯 입력 모드일 때의 카드
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

              {/* 스탯 카운터 (골/어시) */}
              <div className="mt-1 space-y-1 bg-slate-900/80 p-1 rounded">
                {/* 골 */}
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

                {/* 어시스트 */}
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

      {/* 3. 하단 고정 저장 버튼 */}
      <div className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-md px-2">
        <button
          onClick={async () => {
            setIsLoading(true);
            try {
              await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: selectedDate, attendance, stats })
              });
              alert('구글 시트에 성공적으로 저장되었습니다!');
            } catch (e) {
              alert('저장 실패: ' + e.message);
            } finally {
              setIsLoading(false);
            }
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-sm text-white"
        >
          <span>{selectedDate} 기록 구글 시트에 저장</span>
        </button>
      </div>
    </div>
  );
}