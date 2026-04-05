import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { classesAPI, attendanceAPI } from '../../api'
import { SectionHeader, LoadingState, EmptyState } from '../../components/ui'
import AttendanceStats from '../../components/AttendanceStats'
import { BarChart2, ChevronLeft, ChevronRight, Users, Calendar, TrendingUp } from 'lucide-react'
import { format, addWeeks } from 'date-fns'
import clsx from 'clsx'

const TeacherAttendanceAnalysis = () => {
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [filterThreshold, setFilterThreshold] = useState(0)
  const [filterCondition, setFilterCondition] = useState('GREATER') // 'LESS' or 'GREATER'
  const currentYear = '2024-2025' // Should be dynamic ideally

  const { data: classesData } = useQuery({
    queryKey: ['classes', 'teacher'],
    queryFn: () => classesAPI.getAll({ academicYear: currentYear, isClassTeacher: 'true' }),
  })

  const rawClasses = Array.isArray(classesData) ? classesData : (classesData?.classes || [])

  // Auto-select first class
  React.useEffect(() => {
    if (rawClasses.length > 0 && !selectedClass) {
      setSelectedClass(rawClasses[0]._id)
    }
  }, [rawClasses, selectedClass])

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['attendance-stats', selectedClass, date],
    queryFn: () => attendanceAPI.getClassSummary(selectedClass, { date, academicYear: currentYear }),
    enabled: !!selectedClass,
  })

  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', selectedClass],
    queryFn: () => classesAPI.getStudents(selectedClass),
    enabled: !!selectedClass,
  })

  const handlePrevWeek = () => setDate(format(addWeeks(new Date(date), -1), 'yyyy-MM-dd'))
  const handleNextWeek = () => setDate(format(addWeeks(new Date(date), 1), 'yyyy-MM-dd'))

  const weekRange = stats?.weekDays ? `${format(new Date(stats.weekDays[0]), 'MMM d')} — ${format(new Date(stats.weekDays[6]), 'MMM d, yyyy')}` : ''

  const filteredStudents = students?.filter(student => {
    const studentMonthly = stats?.studentStats?.[student._id]?.monthly || 0
    if (filterCondition === 'LESS') return studentMonthly < filterThreshold
    return studentMonthly >= filterThreshold
  }) || []

  return (
    <div className="space-y-6 pb-10">
      <SectionHeader title="Attendance Analysis" subtitle="Review class performance and history" />

      {/* Class & Filters */}
      <div className="card p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <label className="label">Select Class</label>
            <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option value="">Choose class...</option>
              {rawClasses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="lg:col-span-4">
            <label className="label flex items-center justify-between">
              Analysis Period
              <div className="flex items-center gap-1">
                <button onClick={handlePrevWeek} className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-[10px] text-slate-500 uppercase font-black px-2 tracking-widest">Week</span>
                <button onClick={handleNextWeek} className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
            {weekRange && <p className="text-[10px] text-azure-400 mt-2 font-medium bg-azure-500/5 px-2 py-1 rounded inline-block border border-azure-500/10 uppercase tracking-widest">{weekRange}</p>}
          </div>
          <div className="lg:col-span-4">
            <label className="label">Threshold Filter (Monthly %)</label>
            <div className="flex gap-2">
              <select className="input w-32" value={filterCondition} onChange={e => setFilterCondition(e.target.value)}>
                <option value="LESS">Less than</option>
                <option value="GREATER">Above or eq</option>
              </select>
              <div className="relative flex-1">
                <input 
                  type="number" 
                  className="input pr-8" 
                  value={filterThreshold} 
                  onChange={e => setFilterThreshold(Number(e.target.value))}
                  min="0"
                  max="100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">%</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 italic">Showing {filteredStudents.length} of {students?.length || 0} students</p>
          </div>
        </div>
      </div>

      {!selectedClass ? (
        <EmptyState icon={BarChart2} title="No Data to Analyze" description="Please select a class to view attendance patterns and statistics." />
      ) : loadingStats || loadingStudents ? (
        <LoadingState />
      ) : (
        <>
          {/* Main Stats Cards */}
          <AttendanceStats stats={stats} loading={loadingStats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Performance Graph (Simple CSS Implementation) */}
            <div className="card p-5 lg:col-span-1 border-t-4 border-azure-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-azure-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Trend</h3>
                </div>
              </div>
              
              <div className="h-48 flex items-end justify-between px-4 gap-4">
                {stats?.weekDays?.map(day => {
                   // Calculate simplified daily percentage for the class
                   const recordsForDay = Object.values(stats?.studentStats || {}).map(s => s.weekly?.[day]).filter(Boolean)
                   const present = recordsForDay.filter(r => r === 'PRESENT').length
                   const pct = recordsForDay.length > 0 ? Math.round((present / recordsForDay.length) * 100) : 0
                   
                   const isSunday = new Date(day).getUTCDay() === 0
                   
                   return (
                     <div key={day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                       <div className={clsx(
                         "w-full min-w-[14px] max-w-[24px] rounded-t-lg relative overflow-hidden h-full flex flex-col justify-end",
                         isSunday ? "bg-white/10" : "bg-white/5"
                       )}>
                         {!isSunday ? (
                           <>
                             <div 
                               className="w-full bg-gradient-to-t from-azure-600 to-azure-400 rounded-t-lg transition-all duration-700 ease-out"
                               style={{ height: `${pct}%` }}
                             />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-black text-white bg-slate-900/80 px-1.5 py-0.5 rounded shadow-xl border border-white/10">{pct}%</span>
                             </div>
                           </>
                         ) : (
                           <div className="h-full flex items-center justify-center border-t border-white/5">
                             <span className="text-[8px] font-black text-slate-700 uppercase [writing-mode:vertical-lr] rotate-180">Holiday</span>
                           </div>
                         )}
                       </div>
                       <span className={clsx("text-[10px] font-bold uppercase", isSunday ? "text-slate-700" : "text-slate-500")}>
                         {format(new Date(day), 'EEE')}
                       </span>
                     </div>
                   )
                })}
              </div>
              <p className="text-[10px] text-center text-slate-600 mt-4 italic tracking-wide">Daily class-wide attendance percentage</p>
            </div>

            {/* Student History Grid */}
            <div className="card lg:col-span-2 overflow-hidden border-t-4 border-jade-500">
              <div className="p-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-jade-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Historical Grid</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-jade-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Absent</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02]">
                      <th className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">Student</th>
                      <th className="px-5 py-3 text-[10px] font-black text-azure-400 uppercase tracking-widest border-b border-white/5">Month %</th>
                      {stats?.weekDays?.map(day => (
                        <th key={day} className="px-2 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center border-b border-white/5">
                          {format(new Date(day), 'EEE')}<br/>
                          <span className="text-[9px] text-slate-600 font-normal">{format(new Date(day), 'd')}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredStudents.map(student => {
                      const monthlyPct = stats?.studentStats?.[student._id]?.monthly || 0
                      return (
                        <tr key={student._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-white">{student.firstName} {student.lastName}</p>
                            <p className="text-[10px] text-slate-500 font-mono tracking-tight">{student.enrollmentNumber || 'NO-ID'}</p>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[40px]">
                                <div 
                                  className={clsx("h-full transition-all", monthlyPct < filterThreshold ? "bg-rose-500" : "bg-jade-500")}
                                  style={{ width: `${monthlyPct}%` }}
                                />
                              </div>
                              <span className={clsx("text-xs font-bold", monthlyPct < filterThreshold ? "text-rose-400" : "text-jade-400")}>
                                {monthlyPct}%
                              </span>
                            </div>
                          </td>
                        {stats?.weekDays?.map(day => {
                          const status = stats?.studentStats?.[student._id]?.weekly?.[day]
                          const isSunday = new Date(day).getUTCDay() === 0
                          return (
                            <td key={day} className="px-2 py-3 text-center">
                              {isSunday ? (
                                <div className="text-[9px] font-black text-slate-700 uppercase" title="Sunday Holiday">H</div>
                              ) : (
                                <div 
                                  className={clsx(
                                    "w-3 h-3 rounded-full mx-auto transition-all duration-500",
                                    status === 'PRESENT' ? "bg-jade-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] scale-110" :
                                    status === 'ABSENT' ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" :
                                    status === 'LATE' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" :
                                    "bg-white/10 scale-90 border border-white/5"
                                  )}
                                  title={`${format(new Date(day), 'EEE, MMM d')}: ${status || 'No record'}`}
                                />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-white/[0.01] border-t border-white/5">
                <div className="text-[10px] text-slate-600 italic tracking-wide font-medium flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-azure-500 animate-pulse" />
                  Historical data is based on the selected academic week. Navigating ensures synchronization across modules.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default TeacherAttendanceAnalysis
