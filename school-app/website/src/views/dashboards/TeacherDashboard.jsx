import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, saveUserToLocalStorage } from '../../context/AuthContext';
import { Menu, MoreHorizontal, Users, UserCheck, ShieldAlert, Building, Phone, MapPin, GraduationCap, Bus, Play, Square, Compass, RefreshCw, Milestone, Navigation, BookOpen, Image, Calendar, Award, DollarSign, CheckSquare, Trash2, Camera, Clock, LogOut, AlertTriangle, CheckCircle, RefreshCcw, Edit2, Edit3, FileEdit, Search, X, Save, Plus, School, Upload, Bell, Wifi, User, Lock, Unlock, Key, Mail, MailOpen, Eye, Monitor, Download } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import '../Dashboard.css';
import SplashScreen from '../../components/SplashScreen';
import InteractiveMapSelectorModal from '../../components/InteractiveMapSelectorModal';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
import { DashboardLayout, API_URL, LogoutConfirmationModal, ProfileSettingsTab } from './DashboardLayout';
import { StaffCheckInModule, ClassTimetableModule, SchoolCalendarModule } from './DashboardModules';

export const TeacherDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('activeTab_teacher') || 'diary'); // 'diary', 'attendance', 'marks'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Diary States
  const [diaryData, setDiaryData] = useState({
    homework: [{ subject: '', description: '' }],
    classwork: '',
    reminders: '',
    notice: '',
    teacherNote: ''
  });
  const [todayDiary, setTodayDiary] = useState(null);
  const [showReadStatus, setShowReadStatus] = useState(false);
  const [readStatusData, setReadStatusData] = useState({ totalCount: 0, readCount: 0, parents: [] });
  const [fetchingReadStatus, setFetchingReadStatus] = useState(false);

  // Schedule States
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [fullScheduleDoc, setFullScheduleDoc] = useState(null);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState(
    new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  );
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const fetchReadStatus = async (diaryId) => {
    const id = diaryId || todayDiary?._id;
    if (!id) return;
    try {
      setFetchingReadStatus(true);
      const res = await axios.get(`${API_URL}/diaries/${id}/read-status`);
      if (res.data.status === 'success') {
        setReadStatusData({
          totalCount: res.data.totalCount,
          readCount: res.data.readCount,
          parents: res.data.parents
        });
      }
    } catch (err) {
      console.error('Failed to fetch diary read status', err);
    } finally {
      setFetchingReadStatus(false);
    }
  };

  const toggleReadStatus = () => {
    if (!showReadStatus) {
      fetchReadStatus();
    }
    setShowReadStatus(!showReadStatus);
  };

  // 3. Attendance States
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceShift, setAttendanceShift] = useState('Morning');
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);

  // 4. Marks States
  const [marksForm, setMarksForm] = useState({
    subject: 'Mathematics',
    examName: 'Midterm Exam',
    totalMarks: 100
  });
  const [studentMarksList, setStudentMarksList] = useState([]);

  // Transport alerting states
  const [activeAlertBuses, setActiveAlertBuses] = useState([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Poll for transport issues to show delay banner in teacher overview
  useEffect(() => {
    const scanBuses = () => {
      const list = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('bus_') && key.endsWith('_trip')) {
          try {
            const trip = JSON.parse(localStorage.getItem(key));
            if (trip && trip.active && (Date.now() - (trip.lastUpdated || 0) < 15000) && trip.alertStatus && trip.alertStatus !== 'normal') {
              list.push(trip);
            }
          } catch (e) {
            console.warn(e);
          }
        }
      }
      setActiveAlertBuses(list);
    };

    scanBuses();
    const interval = setInterval(scanBuses, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = (allDevices = false) => {
    logout(allDevices);
    navigate('/login');
  };

  // Helper to fetch class list and match attendance/marks
  const fetchClassData = async (silent = false) => {
    if (!user?.classAssigned || !user?.sectionAssigned) {
      return;
    }
    try {
      if (!silent) setLoading(true);
      setError('');
      
      // Fetch attendance which returns all student records for the date and shift
      const attRes = await axios.get(`${API_URL}/attendance/class?date=${attendanceDate}&shift=${attendanceShift}`);
      if (attRes.data.status === 'success') {
        setAttendanceList(attRes.data.attendance);
        setAttendanceSubmitted(!!attRes.data.isSubmitted);
        // Sync student list for marks too
        setStudentMarksList(attRes.data.attendance.map(s => ({
          studentId: s.studentId,
          fullName: s.fullName,
          email: s.email,
          marksObtained: ''
        })));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch class student list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayDiary = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`${API_URL}/diaries/today`);
      if (res.data.status === 'success' && res.data.diary) {
        setTodayDiary(res.data.diary);
        fetchReadStatus(res.data.diary._id);
        setDiaryData({
          homework: res.data.diary.homework.length > 0 
             ? res.data.diary.homework.map(h => ({ subject: h.subject, description: h.description })) 
             : [{ subject: '', description: '' }],
          classwork: res.data.diary.classwork || '',
          reminders: res.data.diary.reminders || '',
          notice: res.data.diary.notice || '',
          teacherNote: res.data.diary.teacherNote || ''
        });
      } else {
        setTodayDiary(null);
        setDiaryData({
          homework: [{ subject: '', description: '' }],
          classwork: '',
          reminders: '',
          notice: '',
          teacherNote: ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const res = await axios.get(`${API_URL}/schedules/today/${user._id || user.id}`);
      if (res.data.status === 'success') {
        setTodaySchedule(res.data.periods || []);
      }
    } catch (err) {
      console.error('Failed to fetch today schedule', err);
    }
  };

  const fetchFullSchedule = async () => {
    try {
      setLoadingSchedule(true);
      const res = await axios.get(`${API_URL}/schedules/teacher/${user._id || user.id}`);
      if (res.data.status === 'success') {
        setFullScheduleDoc(res.data.schedule || null);
      }
    } catch (err) {
      console.error('Failed to fetch full schedule', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    document.body.className = 'theme-teacher';
    fetchTodayDiary();
    fetchClassData();
    fetchTodaySchedule();

    const interval = setInterval(() => {
      fetchTodayDiary(true);
      fetchClassData(true);
      fetchTodaySchedule();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'my-schedule') {
      fetchFullSchedule();
    }
    if (activeTab === 'attendance') {
      fetchTodaySchedule();
    }
  }, [activeTab]);

  // Update attendance list when date or shift changes
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchClassData();
    }
  }, [attendanceDate, attendanceShift, activeTab]);

  // Sync marks list when marks form options change or when tab changes
  useEffect(() => {
    if (activeTab === 'marks') {
      const fetchExistingMarks = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`${API_URL}/marks/class?subject=${marksForm.subject}&examName=${marksForm.examName}`);
          if (res.data.status === 'success' && res.data.marks.length > 0) {
            // Map existing marks
            const mapped = studentMarksList.map(s => {
              const record = res.data.marks.find(m => m.student._id === s.studentId);
              return {
                ...s,
                marksObtained: record ? record.marksObtained : ''
              };
            });
            setStudentMarksList(mapped);
          } else {
            // Clear existing marks input
            setStudentMarksList(prev => prev.map(s => ({ ...s, marksObtained: '' })));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchExistingMarks();
    }
  }, [marksForm.subject, marksForm.examName, activeTab]);

  // 1. Diary Handlers
  const handleAddHomework = () => {
    setDiaryData({
      ...diaryData,
      homework: [...diaryData.homework, { subject: '', description: '' }]
    });
  };

  const handleRemoveHomework = (idx) => {
    const homeworkCopy = [...diaryData.homework];
    homeworkCopy.splice(idx, 1);
    setDiaryData({ ...diaryData, homework: homeworkCopy });
  };

  const handleDiarySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/diaries`, diaryData);
      if (res.data.status === 'success') {
        setSuccess('Diary submitted successfully for today!');
        if (res.data.timeWarning) {
          setError(res.data.timeWarning);
        }
        fetchTodayDiary();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit classroom diary');
    } finally {
      setLoading(false);
    }
  };


  // 3. Attendance Handlers
  const handleAttendanceChange = (studentId, status) => {
    setAttendanceList(prev => prev.map(s => 
      s.studentId === studentId ? { ...s, status } : s
    ));
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const unmarkedStudents = attendanceList.filter(s => !s.status);
    if (unmarkedStudents.length > 0) {
      setError(`Please explicitly mark all students. ${unmarkedStudents.length} student(s) are unmarked.`);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/attendance`, {
        date: attendanceDate,
        shift: attendanceShift,
        attendanceData: attendanceList.map(s => ({
          studentId: s.studentId,
          status: s.status
        }))
      });
      if (res.data.status === 'success') {
        setSuccess('Attendance logs saved successfully for ' + attendanceDate);
        setAttendanceSubmitted(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit attendance');
    } finally {
      setLoading(false);
    }
  };

  // 4. Marks Handlers
  const handleMarkChange = (studentId, value) => {
    setStudentMarksList(prev => prev.map(s => 
      s.studentId === studentId ? { ...s, marksObtained: value } : s
    ));
  };

  const handleMarksSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    const invalid = studentMarksList.some(s => s.marksObtained !== '' && (isNaN(s.marksObtained) || Number(s.marksObtained) > marksForm.totalMarks || Number(s.marksObtained) < 0));
    if (invalid) {
      setError('Please input valid scores. Marks cannot exceed Total Marks or be negative.');
      return;
    }

    const marksToSubmit = studentMarksList
      .filter(s => s.marksObtained !== '')
      .map(s => ({
        studentId: s.studentId,
        subject: marksForm.subject,
        examName: marksForm.examName,
        marksObtained: Number(s.marksObtained),
        totalMarks: Number(marksForm.totalMarks)
      }));

    if (marksToSubmit.length === 0) {
      setError('Please enter marks for at least one student.');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/marks`, {
        marksData: marksToSubmit
      });
      if (res.data.status === 'success') {
        setSuccess('Exam marks posted successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit marks');
    } finally {
      setLoading(false);
    }
  };

  const teacherTabs = [
    { id: 'diary', label: 'Class Diary', icon: BookOpen },
    { id: 'timetable', label: 'Class Timetable', icon: Calendar },
    { id: 'my-schedule', label: 'My Schedule', icon: Clock },
    { id: 'attendance', label: 'Class Attendance', icon: CheckSquare },
    { id: 'marks', label: 'Exam Marks', icon: Award },
    { id: 'checkin', label: 'WiFi Attendance', icon: UserCheck },
    { id: 'calendar', label: 'School Calendar', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  const teacherRoleName = user?.classAssigned 
    ? `Teacher (Class ${user.classAssigned}-${user.sectionAssigned || 'A'})` 
    : 'Teacher';

  return (
    <DashboardLayout
      roleName={teacherRoleName}
      user={user}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabs={teacherTabs}
      handleLogout={() => setShowLogoutModal(true)}
    >

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      {/* Active Transport Delay Bulletin */}
      {activeAlertBuses.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {activeAlertBuses.map(bus => (
            <div key={bus.busNumber} className={`incident-alert-banner alert-${bus.alertStatus}`} style={{ margin: 0 }}>
              <AlertTriangle size={18} />
              <div>
                <strong>Active Transport Delay: Bus {bus.busNumber} reported a {bus.alertStatus.toUpperCase()} alert!</strong>
                <span style={{ fontSize: '13px', marginLeft: '10px', color: 'inherit', opacity: 0.9 }}>
                  Students commuting on this vehicle may arrive late.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Classroom Diary Tab */}
      {activeTab === 'diary' && (
        !user?.classAssigned || !user?.sectionAssigned ? (
          <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '12px' }}>Classroom Not Assigned</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              You are currently not assigned as a class teacher. To submit daily classroom diaries, you must be assigned to a classroom and section.
            </p>
            <button 
              onClick={() => setActiveTab('timetable')} 
              className="dashboard-btn-primary"
              style={{ display: 'inline-block', width: 'auto', margin: '0 auto' }}
            >
              Go to Timetable to Request Assignment
            </button>
          </div>
        ) : (
          <div className="responsive-grid-3-2">
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>Submit Today's Diary</h3>
              <form onSubmit={handleDiarySubmit} className="dashboard-form" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Class Homework Checklist</span>
                    <button type="button" onClick={handleAddHomework} className="code-action-btn" style={{ padding: '4px 10px', fontSize: '12px' }}>
                      + Add Subject
                    </button>
                  </label>
                   {diaryData.homework.map((hw, idx) => (
                    <div key={idx} className="homework-row" style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                      <input
                        type="text"
                        placeholder="Subject (e.g. Science)"
                        className="form-input"
                        value={hw.subject}
                        onChange={(e) => {
                          const copy = [...diaryData.homework];
                          copy[idx].subject = e.target.value;
                          setDiaryData({ ...diaryData, homework: copy });
                        }}
                        required
                        style={{ maxWidth: '150px' }}
                      />
                      <textarea
                        placeholder="Homework description"
                        className="form-input"
                        rows={1}
                        value={hw.description}
                        onChange={(e) => {
                          const copy = [...diaryData.homework];
                          copy[idx].description = e.target.value;
                          setDiaryData({ ...diaryData, homework: copy });
                        }}
                        required
                        style={{ flex: 1, resize: 'vertical' }}
                      />
                      {diaryData.homework.length > 1 && (
                        <button type="button" onClick={() => handleRemoveHomework(idx)} className="logout-btn" style={{ padding: '10px', margin: 0, display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Classwork Done Today *</label>
                  <textarea
                    className="form-input"
                    placeholder="Details of subjects covered in class..."
                    rows={2}
                    value={diaryData.classwork}
                    onChange={(e) => setDiaryData({ ...diaryData, classwork: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reminders *</label>
                  <textarea
                    className="form-input"
                    placeholder="e.g. Bring lab coats tomorrow..."
                    rows={2}
                    value={diaryData.reminders}
                    onChange={(e) => setDiaryData({ ...diaryData, reminders: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Critical Notice Board *</label>
                  <textarea
                    className="form-input"
                    placeholder="Official announcements..."
                    rows={2}
                    value={diaryData.notice}
                    onChange={(e) => setDiaryData({ ...diaryData, notice: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teacher's Note (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="A friendly message for parents..."
                    value={diaryData.teacherNote}
                    onChange={(e) => setDiaryData({ ...diaryData, teacherNote: e.target.value })}
                  />
                </div>

                <button type="submit" className="dashboard-btn-primary" disabled={loading} style={{ width: '100%' }}>
                  {loading ? 'Submitting Diary...' : 'Publish Diary Entry'}
                </button>
              </form>
            </div>

            <div>
              <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
                <h3>Today's Submissions</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 16px 0' }}>
                  Today's class diary submission log.
                </p>

                {todayDiary ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckSquare size={16} /> Diary published for today!
                    </div>
                    {todayDiary.lastEditedAt && (
                      <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#60a5fa' }}>
                        Last edited at {new Date(todayDiary.lastEditedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PUBLISHED AT</span>
                      <p style={{ fontSize: '14px', fontWeight: 'bold' }}>
                        {new Date(todayDiary.postedAt || todayDiary.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                     <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Parent Read Status</h4>
                      
                      <button
                        type="button"
                        onClick={toggleReadStatus}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'background 0.2s ease, transform 0.1s ease',
                          marginBottom: '10px'
                        }}
                      >
                        {showReadStatus 
                          ? 'Hide who read diary' 
                          : `View who read diary (${readStatusData.readCount}/${readStatusData.totalCount})`
                        }
                      </button>

                      {showReadStatus && (
                        <div style={{ 
                          marginTop: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          animation: 'slideDown 0.3s ease-out forwards',
                          overflow: 'hidden'
                        }}>
                          <style>{`
                            @keyframes slideDown {
                              from { max-height: 0; opacity: 0; }
                              to { max-height: 400px; opacity: 1; }
                            }
                          `}</style>
                          
                          <div>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>
                              {readStatusData.readCount} of {readStatusData.totalCount} parents read
                            </p>
                            {readStatusData.totalCount > 0 && (
                              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ 
                                  width: `${(readStatusData.readCount / readStatusData.totalCount) * 100}%`, 
                                  height: '100%', 
                                  background: '#10B981', 
                                  borderRadius: '4px',
                                  transition: 'width 0.5s ease-out'
                                }}></div>
                              </div>
                            )}
                          </div>

                          <div style={{
                            maxHeight: '220px', 
                            overflowY: 'auto',
                            background: 'rgba(0,0,0,0.15)',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            padding: '12px'
                          }}>
                            {fetchingReadStatus ? (
                              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0, fontSize: '13px' }}>Loading read status...</p>
                            ) : readStatusData.parents.length === 0 ? (
                              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 0, fontSize: '13px' }}>No parents assigned to this class yet.</p>
                            ) : (
                              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {readStatusData.parents.map((p) => {
                                  const timeStr = p.markedAsRead && p.readAt
                                    ? new Date(p.readAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'Not read yet';
                                  return (
                                    <li key={p.parentId} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: p.markedAsRead ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                      <span>{p.markedAsRead ? 'Yes' : 'No'}</span>
                                      <span style={{ fontWeight: p.markedAsRead ? '600' : 'normal' }}>
                                        {p.fullName} — {timeStr}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '14px', borderRadius: '8px', fontSize: '13px', color: '#fbbf24' }}>
                    No diary submitted yet today. Classroom diaries must be logged daily.
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h3>Log Student Attendance</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              {/* Shift Segmented Selector */}
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setAttendanceShift('Morning')}
                  className="code-action-btn"
                  style={{
                    margin: 0,
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    background: attendanceShift === 'Morning' ? 'var(--accent)' : 'transparent',
                    borderColor: 'transparent',
                    color: attendanceShift === 'Morning' ? 'white' : 'var(--text-secondary)',
                    fontWeight: attendanceShift === 'Morning' ? '600' : 'normal'
                  }}
                >
                  Morning Shift
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceShift('Afternoon')}
                  className="code-action-btn"
                  style={{
                    margin: 0,
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    background: attendanceShift === 'Afternoon' ? 'var(--accent)' : 'transparent',
                    borderColor: 'transparent',
                    color: attendanceShift === 'Afternoon' ? 'white' : 'var(--text-secondary)',
                    fontWeight: attendanceShift === 'Afternoon' ? '600' : 'normal'
                  }}
                >
                  Afternoon Shift
                </button>
              </div>

              {/* Date Input - Locked/Disabled */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '13px' }}>Date:</label>
                <input
                  type="date"
                  className="form-input"
                  value={attendanceDate}
                  disabled={true}
                  style={{ width: '140px', padding: '6px 10px', opacity: 0.8, cursor: 'not-allowed' }}
                />
              </div>
            </div>
          </div>

          {(() => {
            const getFullDayPeriods = (periodsList) => {
              const maxPeriod = periodsList && periodsList.length > 0
                ? Math.max(6, ...periodsList.map(p => p.periodNumber))
                : 6;
              const fullList = [];
              for (let i = 1; i <= maxPeriod; i++) {
                const existing = periodsList ? periodsList.find(p => p.periodNumber === i) : null;
                if (existing) {
                  fullList.push(existing);
                } else {
                  fullList.push({
                    periodNumber: i,
                    subject: 'Free Period',
                    class: '',
                    section: '',
                    room: '',
                    duration: 45
                  });
                }
              }
              return fullList;
            };

            return attendanceSubmitted ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px', margin: '0 auto 20px auto', width: '100%' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10B981',
                  padding: '16px',
                  borderRadius: '12px',
                  color: '#10B981',
                  fontSize: '15px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  textAlign: 'center'
                }}>
                  Attendance Submitted!
                </div>

                <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                    Your Schedule Today
                  </h4>
                  {todaySchedule && todaySchedule.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {getFullDayPeriods(todaySchedule).map((p, idx) => {
                        const isFree = p.subject.toLowerCase() === 'free period' || p.subject.toLowerCase() === 'free';
                        return (
                          <React.Fragment key={idx}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: isFree ? 'rgba(255, 255, 255, 0.02)' : 'rgba(124, 58, 237, 0.08)',
                              border: '1px solid var(--border)',
                              padding: '12px 16px',
                              borderRadius: '8px'
                            }}>
                              <span style={{ fontWeight: '600', color: isFree ? 'var(--text-secondary)' : 'white', fontSize: '14px' }}>
                                P{p.periodNumber}: {p.subject}
                              </span>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {isFree ? 'Free Period' : `Class ${p.class}${p.section}`}
                              </span>
                            </div>
                            {p.periodNumber === 4 && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '10px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px dashed rgba(245, 158, 11, 0.3)',
                                borderRadius: '8px',
                                color: '#fbbf24',
                                fontWeight: '600',
                                margin: '4px 0'
                              }}>
                                Lunch Break
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <p style={{ fontWeight: 'bold', fontSize: '15px', color: 'white', marginBottom: '4px' }}>No schedule assigned</p>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Contact your principal</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleAttendanceSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {!user?.classAssigned || !user?.sectionAssigned ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 24px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                      <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>You are currently not assigned as a class teacher.</p>
                      <button 
                        type="button"
                        onClick={() => setActiveTab('timetable')} 
                        className="code-action-btn"
                        style={{ margin: '0 auto', display: 'block' }}
                      >
                        Go to Timetable to Request Assignment
                      </button>
                    </div>
                  ) : attendanceList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 24px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                      No parents/students registered to your class.
                    </div>
                  ) : (
                    attendanceList.map((student) => (
                      <div
                        key={student.studentId}
                        className="glass-card"
                        style={{
                          padding: '14px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '15px',
                          flexWrap: 'wrap',
                          borderLeft: student.status === 'Present' ? '4px solid #10b981' : student.status === 'Absent' ? '4px solid #ef4444' : '4px solid var(--border)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ flex: '1 1 200px', minWidth: '0' }}>
                          <strong style={{ display: 'block', fontSize: '15px', color: 'white', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {student.fullName}
                          </strong>
                          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {student.email}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {/* Present Button */}
                          <button
                            type="button"
                            disabled={attendanceSubmitted || loading}
                            onClick={() => handleAttendanceChange(student.studentId, 'Present')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: '1px solid',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: attendanceSubmitted ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              background: student.status === 'Present' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                              borderColor: student.status === 'Present' ? '#10b981' : 'rgba(255,255,255,0.08)',
                              color: student.status === 'Present' ? '#34d399' : 'var(--text-secondary)'
                            }}
                          >
                            <CheckCircle size={14} style={{ opacity: student.status === 'Present' ? 1 : 0.4 }} />
                            <span>Present</span>
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            disabled={attendanceSubmitted || loading}
                            onClick={() => handleAttendanceChange(student.studentId, 'Absent')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: '1px solid',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: attendanceSubmitted ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              background: student.status === 'Absent' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                              borderColor: student.status === 'Absent' ? '#ef4444' : 'rgba(255,255,255,0.08)',
                              color: student.status === 'Absent' ? '#f87171' : 'var(--text-secondary)'
                            }}
                          >
                            <X size={14} style={{ opacity: student.status === 'Absent' ? 1 : 0.4 }} />
                            <span>Absent</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {attendanceList.length > 0 && !attendanceSubmitted && (
                  <button type="submit" className="dashboard-btn-primary" disabled={loading} style={{ float: 'right' }}>
                    {loading ? 'Saving Attendance...' : 'Submit Attendance Log'}
                  </button>
                )}
                <div style={{ clear: 'both' }}></div>
              </form>
            );
          })()}
        </div>
      )}

      {/* Marks & Reports Tab */}
      {activeTab === 'marks' && (
        !user?.classAssigned || !user?.sectionAssigned ? (
          <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '12px' }}>Classroom Not Assigned</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              You are currently not assigned as a class teacher. To enter student grades and exam marks, you must be assigned to a classroom and section.
            </p>
            <button 
              onClick={() => setActiveTab('timetable')} 
              className="dashboard-btn-primary"
              style={{ display: 'inline-block', width: 'auto', margin: '0 auto' }}
            >
              Go to Timetable to Request Assignment
            </button>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className="responsive-grid-4" style={{ marginBottom: '20px', alignItems: 'end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={marksForm.subject}
                  onChange={(e) => setMarksForm({ ...marksForm, subject: e.target.value })}
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Exam Title</label>
                <select
                  className="form-select"
                  value={marksForm.examName}
                  onChange={(e) => setMarksForm({ ...marksForm, examName: e.target.value })}
                >
                  <option value="Midterm Exam">Midterm Exam</option>
                  <option value="Finals Exam">Finals Exam</option>
                  <option value="Class Assessment 1">Class Assessment 1</option>
                  <option value="Class Assessment 2">Class Assessment 2</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Maximum Total Marks</label>
                <input
                  type="number"
                  className="form-input"
                  value={marksForm.totalMarks}
                  onChange={(e) => setMarksForm({ ...marksForm, totalMarks: Number(e.target.value) })}
                  min={1}
                  required
                />
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingBottom: '10px' }}>
                Enter scores below. Grades (A+, A, B, C, D, F) calculate automatically.
              </div>
            </div>

            <form onSubmit={handleMarksSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {studentMarksList.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 24px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                    No parents/students registered to your class.
                  </div>
                ) : (
                  studentMarksList.map((student) => {
                    const pct = student.marksObtained !== '' && !isNaN(student.marksObtained)
                      ? Math.round((Number(student.marksObtained) / marksForm.totalMarks) * 100)
                      : null;
                    return (
                      <div
                        key={student.studentId}
                        className="glass-card"
                        style={{
                          padding: '16px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '16px',
                          flexWrap: 'wrap',
                          borderLeft: pct !== null ? (pct >= 50 ? '4px solid #10b981' : '4px solid #ef4444') : '4px solid var(--border)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div style={{ flex: '1 1 200px', minWidth: '0' }}>
                          <strong style={{ display: 'block', fontSize: '15px', color: 'white' }}>
                            {student.fullName}
                          </strong>
                          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {student.email}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                          {/* Marks Input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Score"
                              value={student.marksObtained}
                              onChange={(e) => handleMarkChange(student.studentId, e.target.value)}
                              style={{ width: '85px', padding: '6px 12px', textAlign: 'center', margin: 0 }}
                            />
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>/ {marksForm.totalMarks}</span>
                          </div>

                          {/* Calculated Grade & Percentage Badge */}
                          <div style={{ minWidth: '100px', textAlign: 'right' }}>
                            {pct !== null ? (
                              <span style={{ 
                                display: 'inline-block',
                                fontSize: '12px', 
                                fontWeight: 'bold', 
                                padding: '4px 10px', 
                                borderRadius: '12px', 
                                background: pct >= 50 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: pct >= 50 ? '#34d399' : '#f87171',
                                border: pct >= 50 ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                              }}>
                                {pct}% ({pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'})
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Not Entered</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {studentMarksList.length > 0 && (
                <button type="submit" className="dashboard-btn-primary" disabled={loading} style={{ float: 'right' }}>
                  {loading ? 'Posting Marks...' : 'Publish Exam Marks'}
                </button>
              )}
            </form>
          </div>
        )
      )}

      {/* WiFi Attendance Check-in Tab */}
      {activeTab === 'checkin' && (
        <StaffCheckInModule />
      )}

      {activeTab === 'timetable' && (
        <ClassTimetableModule />
      )}

      {activeTab === 'my-schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              My Weekly Schedule
            </h3>
            
            {/* Horizontal Day selection strip */}
            <div style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '12px',
              marginBottom: '20px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                const isSelected = selectedScheduleDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedScheduleDay(day)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      background: isSelected 
                        ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' 
                        : 'rgba(255,255,255,0.02)',
                      border: '1px solid',
                      borderColor: isSelected ? '#7c3aed' : 'var(--border)',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {day} {isToday && <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px' }}>Today</span>}
                  </button>
                );
              })}
            </div>

            {loadingSchedule ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading schedule...</div>
            ) : !fullScheduleDoc ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ fontWeight: 'bold', fontSize: '16px', color: 'white', marginBottom: '6px' }}>No schedule assigned</p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Contact your principal</p>
              </div>
            ) : (
              <div>
                {/* Validity Indicator */}
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  marginBottom: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  display: 'inline-block'
                }}>
                  {fullScheduleDoc.isPermanent ? 'Permanent Active Schedule' : `Valid from: ${new Date(fullScheduleDoc.validFrom).toLocaleDateString()} to ${new Date(fullScheduleDoc.validTo).toLocaleDateString()}`}
                </div>

                {/* Periods List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(() => {
                    const dayPeriods = fullScheduleDoc.schedule?.[selectedScheduleDay] || [];
                    const sortedDayPeriods = [...dayPeriods].sort((a,b) => a.periodNumber - b.periodNumber);
                    const getFullDayPeriods = (periodsList) => {
                      const maxPeriod = periodsList && periodsList.length > 0
                        ? Math.max(6, ...periodsList.map(p => p.periodNumber))
                        : 6;
                      const fullList = [];
                      for (let i = 1; i <= maxPeriod; i++) {
                        const existing = periodsList ? periodsList.find(p => p.periodNumber === i) : null;
                        if (existing) {
                          fullList.push(existing);
                        } else {
                          fullList.push({
                            periodNumber: i,
                            subject: 'Free Period',
                            class: '',
                            section: '',
                            room: '',
                            duration: 45
                          });
                        }
                      }
                      return fullList;
                    };
                    
                    const fullList = getFullDayPeriods(sortedDayPeriods);
                    
                    return fullList.map((p, idx) => {
                      const isFree = p.subject.toLowerCase() === 'free period' || p.subject.toLowerCase() === 'free';
                      return (
                        <React.Fragment key={idx}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: isFree ? 'rgba(255, 255, 255, 0.01)' : 'rgba(124, 58, 237, 0.08)',
                            border: '1px solid var(--border)',
                            padding: '14px 18px',
                            borderRadius: '10px'
                          }}>
                            <div>
                              <span style={{ fontWeight: '600', color: isFree ? 'var(--text-secondary)' : 'white', fontSize: '15px' }}>
                                Period {p.periodNumber}: {p.subject}
                              </span>
                              {!isFree && (
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                  Room: {p.room || 'N/A'} • Duration: {p.duration} mins
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                              {isFree ? 'Free Period' : `Class ${p.class}${p.section}`}
                            </span>
                          </div>
                          {p.periodNumber === 4 && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              padding: '10px',
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px dashed rgba(245, 158, 11, 0.3)',
                              borderRadius: '8px',
                              color: '#fbbf24',
                              fontWeight: '600',
                              margin: '4px 0'
                            }}>
                              Lunch Break
                            </div>
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <SchoolCalendarModule user={user} canEdit={false} />
      )}

      <LogoutConfirmationModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />
      {activeTab === 'profile' && (
        <ProfileSettingsTab />
      )}
    </DashboardLayout>
  );
};

// -------------------------------------------------------------
// TRIP ROUTE PLAYBACK ANIMATION MODAL (Swiggy-like replaying)
// -------------------------------------------------------------

export default TeacherDashboard;
