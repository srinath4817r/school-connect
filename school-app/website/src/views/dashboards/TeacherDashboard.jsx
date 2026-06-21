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

const pruneOldMessages = (messages) => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return messages.filter(msg => {
    const timestampStr = msg.timestamp || msg.time;
    if (!timestampStr) return true;
    const msgTime = new Date(timestampStr).getTime();
    return msgTime >= sevenDaysAgo;
  });
};

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
  const [attendanceSubTab, setAttendanceSubTab] = useState('mark'); // 'mark' or 'report'
  const [classReportData, setClassReportData] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState('');

  // 4. Marks States
  const [marksForm, setMarksForm] = useState({
    subject: 'Mathematics',
    examName: 'Midterm Exam',
    totalMarks: 100
  });
  const [studentMarksList, setStudentMarksList] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showCreateSessionForm, setShowCreateSessionForm] = useState(false);
  const [showCreateMultiSessionForm, setShowCreateMultiSessionForm] = useState(false);
  const [showCustomExamMulti, setShowCustomExamMulti] = useState(false);
  const [multiSessionForm, setMultiSessionForm] = useState({
    examName: 'Annual Exam',
    subjects: [{ name: 'Mathematics', totalMarks: 100, isCustom: false }]
  });
  const [selectedStudentForMarks, setSelectedStudentForMarks] = useState(null);
  const [tempStudentMark, setTempStudentMark] = useState('');
  const [allMarksList, setAllMarksList] = useState([]);
  const [localSessions, setLocalSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('school_marks_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('school_marks_sessions', JSON.stringify(localSessions));
  }, [localSessions]);

  const examSessions = useMemo(() => {
    const sessionsMap = {};

    // First, populate all local sessions
    localSessions.forEach(s => {
      const key = s.isMulti ? `multi_${s.examName}` : `${s.subject}_${s.examName}`;
      sessionsMap[key] = {
        id: s.id || key,
        examName: s.examName,
        subject: s.subject || '',
        subjects: s.subjects || [],
        totalMarks: s.totalMarks || 100,
        isMulti: !!s.isMulti,
        gradedCount: 0
      };
    });

    // Next, scan allMarksList to find any sessions from the DB that aren't in localSessions
    allMarksList.forEach(record => {
      const key = `${record.subject}_${record.examName}`;
      
      const parentMultiSession = localSessions.find(s => 
        s.isMulti && 
        s.examName === record.examName && 
        s.subjects.some(sub => sub.name === record.subject)
      );
      
      if (parentMultiSession) {
        return;
      }

      if (!sessionsMap[key]) {
        sessionsMap[key] = {
          id: key,
          examName: record.examName,
          subject: record.subject,
          subjects: [{ name: record.subject, totalMarks: record.totalMarks || 100 }],
          totalMarks: record.totalMarks || 100,
          isMulti: false,
          gradedCount: 0
        };
      }
    });

    // Calculate the gradedCount for each session
    Object.values(sessionsMap).forEach(session => {
      const gradedStudents = new Set();
      allMarksList.forEach(record => {
        const matchesSession = session.isMulti
          ? (record.examName === session.examName && session.subjects.some(sub => sub.name === record.subject))
          : (record.examName === session.examName && record.subject === session.subject);

        if (matchesSession && record.student && record.marksObtained !== undefined && record.marksObtained !== null && record.marksObtained !== '') {
          const studentId = record.student._id || record.student;
          gradedStudents.add(studentId);
        }
      });
      session.gradedCount = gradedStudents.size;
    });

    return Object.values(sessionsMap);
  }, [allMarksList, localSessions]);


  // Leave Requests states
  const [leavesList, setLeavesList] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  // Chat / Messaging states
  const [selectedParentId, setSelectedParentId] = useState('');
  const [teacherChatMessages, setTeacherChatMessages] = useState([]);
  const [teacherChatInput, setTeacherChatInput] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [showCustomExam, setShowCustomExam] = useState(false);
  const [selectedExamProgress, setSelectedExamProgress] = useState('All');
  const [customExamProgressText, setCustomExamProgressText] = useState('');
  const [showCustomExamProgress, setShowCustomExamProgress] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Sync messages from DB for selected parent
  useEffect(() => {
    if (activeTab !== 'messages' || !selectedParentId) {
      setTeacherChatMessages([]);
      return;
    }
    
    const loadMessages = async () => {
      try {
        const res = await axios.get(`${API_URL}/messages?parentId=${selectedParentId}`);
        if (res.data.status === 'success') {
          const dbMsgs = res.data.messages || [];
          const formatted = dbMsgs.map(msg => ({
            id: msg._id,
            sender: msg.sender,
            text: msg.text,
            timestamp: msg.createdAt || msg.timestamp,
            linkToTab: msg.linkToTab
          }));
          
          let finalMsgs = formatted;
          if (formatted.length === 0) {
            finalMsgs = [
              {
                id: '1',
                sender: 'teacher',
                text: `Hello! I am ${user?.fullName || "your child's class teacher"}. Let me know if you have any questions about today's diary, attendance, or academic progress.`,
                timestamp: new Date(Date.now() - 3600000).toISOString()
              }
            ];
          }
          
          const hasChanged = finalMsgs.length !== teacherChatMessages.length || 
            (finalMsgs.length > 0 && teacherChatMessages.length > 0 && finalMsgs[finalMsgs.length - 1].id !== teacherChatMessages[teacherChatMessages.length - 1].id);
            
          if (hasChanged) {
            setTeacherChatMessages(finalMsgs);
          }
        }
      } catch (err) {
        console.error('Failed to load chat history from DB:', err);
      }
    };

    loadMessages();

    // Poll for new messages every 1 second
    const interval = setInterval(loadMessages, 1000);
    return () => clearInterval(interval);
  }, [activeTab, selectedParentId, user?.fullName, teacherChatMessages.length]);
  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'messages' && selectedParentId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [teacherChatMessages, activeTab, selectedParentId]);

  // Sync class parental list when entering messages tab
  useEffect(() => {
    if (activeTab === 'messages' && attendanceList.length === 0) {
      fetchClassData(true);
    }
  }, [activeTab]);

  // Poll unread messages counts for teacher
  useEffect(() => {
    if (activeTab !== 'messages') return;

    const loadUnreadCounts = async () => {
      try {
        const res = await axios.get(`${API_URL}/messages/unread`);
        if (res.data.status === 'success') {
          const counts = res.data.counts || {};
          if (selectedParentId) {
            counts[selectedParentId] = 0;
          }
          setUnreadCounts(counts);
        }
      } catch (err) {
        console.error('Failed to load unread counts:', err);
      }
    };

    loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 2000);
    return () => clearInterval(interval);
  }, [activeTab, selectedParentId]);

  // Mark parent messages as read on selection
  useEffect(() => {
    if (selectedParentId) {
      setUnreadCounts(prev => ({
        ...prev,
        [selectedParentId]: 0
      }));
      axios.put(`${API_URL}/messages/read`, { parentId: selectedParentId }).catch(err => {
        console.error('Failed to mark parent messages as read:', err);
      });
    }
  }, [selectedParentId]);

  const fetchLeaves = async () => {
    try {
      setLoadingLeaves(true);
      setError('');
      setSuccess('');
      const res = await axios.get(`${API_URL}/attendance/leaves`);
      if (res.data.status === 'success') {
        setLeavesList(res.data.leaves || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch leave requests.');
    } finally {
      setLoadingLeaves(false);
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      setError('');
      setSuccess('');
      const res = await axios.post(`${API_URL}/attendance/leave/${id}/approve`);
      if (res.data.status === 'success') {
        setSuccess('Leave request approved!');
        fetchLeaves();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve leave request.');
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      setError('');
      setSuccess('');
      const res = await axios.post(`${API_URL}/attendance/leave/${id}/reject`);
      if (res.data.status === 'success') {
        setSuccess('Leave request rejected!');
        fetchLeaves();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject leave request.');
    }
  };

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
  const handleTeacherSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!teacherChatInput.trim() || !selectedParentId) return;
    const textToSend = teacherChatInput.trim();
    setTeacherChatInput('');
    try {
      const res = await axios.post(`${API_URL}/messages`, {
        text: textToSend,
        parentId: selectedParentId
      });
      if (res.data.status === 'success') {
        const savedMsg = res.data.message;
        const newMsg = {
          id: savedMsg._id,
          sender: savedMsg.sender,
          text: savedMsg.text,
          timestamp: savedMsg.createdAt,
          linkToTab: savedMsg.linkToTab
        };
        const filteredMessages = teacherChatMessages.length === 1 && teacherChatMessages[0].id === '1' ? [] : teacherChatMessages;
        setTeacherChatMessages([...filteredMessages, newMsg]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSendStudentProgress = async () => {
    if (!selectedParentId) return;
    try {
      const parent = attendanceList.find(p => p.studentId === selectedParentId);
      const studentName = parent ? parent.fullName : 'your child';
      
      const res = await axios.get(`${API_URL}/marks/class`);
      let studentMarks = res.data.marks.filter(m => m.student && (m.student._id === selectedParentId || m.student === selectedParentId));
      
      const filterExam = selectedExamProgress === 'Custom' 
        ? customExamProgressText.trim() 
        : selectedExamProgress;
        
      if (filterExam !== 'All') {
        studentMarks = studentMarks.filter(m => m.examName && m.examName.toLowerCase() === filterExam.toLowerCase());
      }
      
      let text = `Academic Progress Report for ${studentName}${filterExam !== 'All' ? ` (${filterExam})` : ''}:\n\n`;
      if (studentMarks.length === 0) {
        text += `No exam marks have been recorded for ${studentName} under "${filterExam}" yet.\n\n`;
      } else {
        studentMarks.forEach(m => {
          const percentage = Math.round((m.marksObtained / m.totalMarks) * 100);
          text += `• ${m.subject} (${m.examName}): ${m.marksObtained}/${m.totalMarks} (${percentage}%)\n`;
        });
        text += `\n`;
      }
      text += `You can see here the detailed marks profile. Please click the button below to view detailed reports.`;

      const apiRes = await axios.post(`${API_URL}/messages`, {
        text: text,
        parentId: selectedParentId,
        linkToTab: 'marks'
      });

      if (apiRes.data.status === 'success') {
        const savedMsg = apiRes.data.message;
        const newMsg = {
          id: savedMsg._id,
          sender: savedMsg.sender,
          text: savedMsg.text,
          timestamp: savedMsg.createdAt,
          linkToTab: savedMsg.linkToTab
        };
        const filteredMessages = teacherChatMessages.length === 1 && teacherChatMessages[0].id === '1' ? [] : teacherChatMessages;
        setTeacherChatMessages([...filteredMessages, newMsg]);
      }
    } catch (err) {
      console.error('Failed to send progress report', err);
      alert('Failed to send progress report. Please try again.');
    }
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
        // Sync student list for marks too, preserving already entered/loaded marks
        setStudentMarksList(prev => {
          return attRes.data.attendance.map(s => {
            const existing = prev.find(x => x.studentId === s.studentId);
            return {
              studentId: s.studentId,
              fullName: s.fullName,
              email: s.email,
              marksObtained: existing ? existing.marksObtained : ''
            };
          });
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch class student list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassAttendanceReport = async () => {
    try {
      setLoadingReport(true);
      setErrorReport('');
      const res = await axios.get(`${API_URL}/attendance/class-report`);
      if (res.data.status === 'success') {
        setClassReportData(res.data.report || []);
      }
    } catch (err) {
      console.error(err);
      setErrorReport(err.response?.data?.message || 'Failed to fetch attendance reports.');
    } finally {
      setLoadingReport(false);
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
    if (activeTab === 'leaves') {
      fetchLeaves();
    }
  }, [activeTab]);

  // Update attendance list when date or shift changes
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchClassData();
    }
  }, [attendanceDate, attendanceShift, activeTab]);

  useEffect(() => {
    if (activeTab === 'attendance' && attendanceSubTab === 'report') {
      fetchClassAttendanceReport();
    }
  }, [activeTab, attendanceSubTab]);

  const fetchAllClassMarks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/marks/class`);
      if (res.data.status === 'success') {
        setAllMarksList(res.data.marks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessionMarks = async (session) => {
    if (!session) return;
    try {
      setLoading(true);
      
      let url = `${API_URL}/marks/class?examName=${session.examName}`;
      if (!session.isMulti) {
        url += `&subject=${session.subject}`;
      }
      const res = await axios.get(url);
      
      const listToMap = attendanceList.map(s => ({
        studentId: s.studentId,
        fullName: s.fullName,
        email: s.email,
        marksObtained: {}
      }));
      
      if (res.data.status === 'success' && res.data.marks.length > 0) {
        setStudentMarksList(listToMap.map(s => {
          const studentRecords = res.data.marks.filter(m => m.student && (m.student._id === s.studentId || m.student === s.studentId));
          
          const marksObtainedMap = {};
          if (session.isMulti) {
            session.subjects.forEach(sub => {
              const record = studentRecords.find(m => m.subject === sub.name);
              marksObtainedMap[sub.name] = record ? record.marksObtained.toString() : '';
            });
          } else {
            const record = studentRecords.find(m => m.subject === session.subject);
            marksObtainedMap[session.subject] = record ? record.marksObtained.toString() : '';
          }
          
          return {
            ...s,
            marksObtained: session.isMulti ? marksObtainedMap : (marksObtainedMap[session.subject] || '')
          };
        }));
      } else {
        setStudentMarksList(listToMap.map(s => ({
          ...s,
          marksObtained: session.isMulti ? {} : ''
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = (e) => {
    e.preventDefault();
    if (!marksForm.subject || !marksForm.examName || !marksForm.totalMarks) {
      alert("Please fill in all session details.");
      return;
    }
    const newSession = {
      id: `single_${Date.now()}`,
      subject: marksForm.subject,
      examName: marksForm.examName,
      totalMarks: Number(marksForm.totalMarks),
      isMulti: false,
      gradedCount: 0
    };
    setLocalSessions(prev => {
      const exists = prev.some(s => !s.isMulti && s.subject === newSession.subject && s.examName === newSession.examName);
      if (exists) return prev;
      return [...prev, newSession];
    });
    setActiveSession(newSession);
    setShowCreateSessionForm(false);
    setStudentMarksList(attendanceList.map(s => ({
      studentId: s.studentId,
      fullName: s.fullName,
      email: s.email,
      marksObtained: ''
    })));
  };

  const handleCreateMultiSession = (e) => {
    e.preventDefault();
    if (!multiSessionForm.examName || multiSessionForm.subjects.length === 0) {
      alert("Please fill in all session details and add at least one subject.");
      return;
    }
    
    // Check for duplicate subjects
    const subjectNames = multiSessionForm.subjects.map(s => s.name);
    const hasDuplicates = subjectNames.some((val, i) => subjectNames.indexOf(val) !== i);
    if (hasDuplicates) {
      alert("Please do not add duplicate subjects in the same session.");
      return;
    }

    const newSession = {
      id: `multi_${Date.now()}`,
      examName: multiSessionForm.examName,
      subjects: multiSessionForm.subjects.map(s => ({ name: s.name, totalMarks: Number(s.totalMarks) })),
      isMulti: true,
      gradedCount: 0
    };
    
    setLocalSessions(prev => {
      const exists = prev.some(s => s.isMulti && s.examName === newSession.examName);
      if (exists) {
        alert("A multi-subject session with this Exam Title already exists.");
        return prev;
      }
      return [...prev, newSession];
    });

    setActiveSession(newSession);
    setShowCreateMultiSessionForm(false);
    
    const listToMap = attendanceList.map(s => ({
      studentId: s.studentId,
      fullName: s.fullName,
      email: s.email,
      marksObtained: {}
    }));
    setStudentMarksList(listToMap);
  };

  const handleSingleMarkSubmit = async (studentId, scoreVal) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      let records = [];
      
      if (activeSession.isMulti) {
        let hasAnyValue = false;
        for (const sub of activeSession.subjects) {
          const val = scoreVal[sub.name];
          if (val !== '' && val !== undefined && val !== null) {
            const num = Number(val);
            if (isNaN(num) || num < 0 || num > sub.totalMarks) {
              alert(`Score for ${sub.name} must be between 0 and ${sub.totalMarks}.`);
              setLoading(false);
              return;
            }
            records.push({
              studentId,
              subject: sub.name,
              examName: activeSession.examName,
              marksObtained: num,
              totalMarks: Number(sub.totalMarks)
            });
            hasAnyValue = true;
          }
        }
        if (!hasAnyValue) {
          alert("Please enter a score for at least one subject.");
          setLoading(false);
          return;
        }
      } else {
        if (scoreVal === '' || scoreVal === undefined || scoreVal === null) {
          alert("Please enter a valid mark score.");
          setLoading(false);
          return;
        }
        const scoreNum = Number(scoreVal);
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > activeSession.totalMarks) {
          alert(`Score must be between 0 and ${activeSession.totalMarks}.`);
          setLoading(false);
          return;
        }
        records.push({
          studentId,
          subject: activeSession.subject,
          examName: activeSession.examName,
          marksObtained: scoreNum,
          totalMarks: Number(activeSession.totalMarks)
        });
      }
      
      const res = await axios.post(`${API_URL}/marks`, {
        marksData: records
      });
      if (res.data.status === 'success') {
        setSuccess('Marks updated successfully!');
        setStudentMarksList(prev => prev.map(s => 
          s.studentId === studentId ? { ...s, marksObtained: scoreVal } : s
        ));
        await fetchAllClassMarks();
        if (activeSession) {
          await fetchActiveSessionMarks(activeSession);
        }
        setSelectedStudentForMarks(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update marks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'marks') {
      fetchAllClassMarks();
      if (activeSession) {
        fetchActiveSessionMarks(activeSession);
      }
    }
  }, [activeTab, activeSession]);


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
    { id: 'leaves', label: 'Leave Requests', icon: FileEdit },
    { id: 'messages', label: 'Parent Messages', icon: Mail },
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
          {/* Sub Tab Selector */}
          <div className="dashboard-tabs" style={{ background: 'rgba(0,0,0,0.15)', padding: '4px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '4px', maxWidth: '380px' }}>
            <button
              onClick={() => setAttendanceSubTab('mark')}
              className={`tab-btn ${attendanceSubTab === 'mark' ? 'active' : ''}`}
              style={{ padding: '8px 16px', fontSize: '13px', margin: 0, flex: 1 }}
            >
              Mark Today's Attendance
            </button>
            <button
              onClick={() => setAttendanceSubTab('report')}
              className={`tab-btn ${attendanceSubTab === 'report' ? 'active' : ''}`}
              style={{ padding: '8px 16px', fontSize: '13px', margin: 0, flex: 1 }}
            >
              Attendance Reports
            </button>
          </div>

          {attendanceSubTab === 'report' ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Class Attendance Reports</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    Month-wise and cumulative attendance details for all class students.
                  </p>
                </div>
                <button 
                  onClick={fetchClassAttendanceReport}
                  className="code-action-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}
                  disabled={loadingReport}
                >
                  <RefreshCw size={14} className={loadingReport ? 'spin-anim' : ''} />
                  <span>Refresh Report</span>
                </button>
              </div>

              {loadingReport ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  Loading class reports...
                </div>
              ) : errorReport ? (
                <div className="error-banner" style={{ marginBottom: '20px' }}>
                  {errorReport}
                </div>
              ) : classReportData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No student records available for this class.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {classReportData.map((student) => {
                    const formatDays = (daysVal) => {
                      if (daysVal === undefined || daysVal === null) return '0';
                      const integerPart = Math.floor(daysVal);
                      const hasHalf = (daysVal % 1) !== 0;
                      if (hasHalf) {
                        return integerPart > 0 ? `${integerPart} 1/2` : '1/2';
                      }
                      return String(integerPart);
                    };

                    return (
                      <div 
                        key={student.studentId}
                        className="glass-card"
                        style={{
                          padding: '20px',
                          background: 'rgba(255, 255, 255, 0.01)',
                          border: '1.5px solid var(--border)',
                          borderRadius: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '16px', color: 'white' }}>{student.fullName}</h4>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{student.email}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Attendance Rate</span>
                              <strong style={{ fontSize: '18px', color: student.stats.presentRate >= 85 ? '#34d399' : '#f87171' }}>
                                {student.stats.presentRate}%
                              </strong>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Present</span>
                              <strong style={{ fontSize: '18px', color: '#34d399' }}>{formatDays(student.stats.present)} d</strong>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Absent</span>
                              <strong style={{ fontSize: '18px', color: '#f87171' }}>{formatDays(student.stats.absent)} d</strong>
                            </div>
                          </div>
                        </div>

                        {/* Monthly breakdown */}
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Month-wise Breakdown</span>
                          {student.stats.monthly.length === 0 ? (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No monthly data log.</span>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                              {student.stats.monthly.map((m, mIdx) => (
                                <div 
                                  key={mIdx}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px'
                                  }}
                                >
                                  <strong style={{ fontSize: '13px', color: 'white' }}>{m.month}</strong>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>P: <strong style={{ color: '#34d399' }}>{formatDays(m.presentDays)}</strong></span>
                                    <span style={{ color: 'var(--text-muted)' }}>A: <strong style={{ color: '#f87171' }}>{formatDays(m.absentDays)}</strong></span>
                                    <span style={{ fontWeight: 'bold', color: m.presentRate >= 85 ? '#34d399' : '#f87171' }}>{m.presentRate}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
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
          </>
          )}
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
          <div className="glass-card" style={{ padding: isMobile ? '12px' : '24px' }}>
            {activeSession === null ? (
              // 1. Session List View
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Exam Marks Entry</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Manage academic assessment sessions and log student grades.
                    </p>
                  </div>
                  {!showCreateSessionForm && !showCreateMultiSessionForm && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setShowCreateSessionForm(true);
                          setShowCreateMultiSessionForm(false);
                        }}
                        className="dashboard-btn-primary"
                        style={{ 
                          margin: 0, 
                          padding: '10px 18px', 
                          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                          borderColor: '#7c3aed',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px'
                        }}
                      >
                        <Plus size={15} /> Add Single Subject Session
                      </button>
                      
                      <button
                        onClick={() => {
                          setShowCreateMultiSessionForm(true);
                          setShowCreateSessionForm(false);
                        }}
                        className="dashboard-btn-primary"
                        style={{ 
                          margin: 0, 
                          padding: '10px 18px', 
                          background: 'linear-gradient(135deg, #10B981, #059669)', 
                          borderColor: '#10B981',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px'
                        }}
                      >
                        <Plus size={15} /> Add Multi-Subject Session
                      </button>
                    </div>
                  )}
                </div>

                {showCreateSessionForm && (
                  <form onSubmit={handleCreateSession} className="glass-card" style={{ padding: '20px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', color: 'white' }}>Create New Marks Entry Session</h4>
                    <div className="responsive-grid-3" style={{ alignItems: 'end', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Subject</label>
                        {!showCustomSubject ? (
                          <select
                            className="form-select"
                            value={marksForm.subject}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Custom') {
                                setShowCustomSubject(true);
                                setMarksForm(prev => ({ ...prev, subject: '' }));
                              } else {
                                setMarksForm(prev => ({ ...prev, subject: val }));
                              }
                            }}
                          >
                            <option value="Mathematics">Mathematics</option>
                            <option value="Science">Science</option>
                            <option value="English">English</option>
                            <option value="Social Studies">Social Studies</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Custom">Custom...</option>
                          </select>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Enter subject name"
                              value={marksForm.subject}
                              onChange={(e) => setMarksForm(prev => ({ ...prev, subject: e.target.value }))}
                              required
                            />
                            <button 
                              type="button" 
                              onClick={() => {
                                setShowCustomSubject(false);
                                setMarksForm(prev => ({ ...prev, subject: 'Mathematics' }));
                              }}
                              className="logout-btn" 
                              style={{ margin: 0, padding: '8px 12px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Exam Title</label>
                        {!showCustomExam ? (
                          <select
                            className="form-select"
                            value={marksForm.examName}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Custom') {
                                setShowCustomExam(true);
                                setMarksForm(prev => ({ ...prev, examName: '' }));
                              } else {
                                setMarksForm(prev => ({ ...prev, examName: val }));
                              }
                            }}
                          >
                            <option value="Midterm Exam">Midterm Exam</option>
                            <option value="Class Assessment 1">Class Assessment 1</option>
                            <option value="Final Exam">Final Exam</option>
                            <option value="Custom">Custom...</option>
                          </select>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. Midterm Exam, Quiz 1"
                              value={marksForm.examName}
                              onChange={(e) => setMarksForm(prev => ({ ...prev, examName: e.target.value }))}
                              required
                            />
                            <button 
                              type="button" 
                              onClick={() => {
                                setShowCustomExam(false);
                                setMarksForm(prev => ({ ...prev, examName: 'Midterm Exam' }));
                              }}
                              className="logout-btn" 
                              style={{ margin: 0, padding: '8px 12px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                            >
                              Reset
                            </button>
                          </div>
                        )}
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
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button 
                        type="button" 
                        onClick={() => setShowCreateSessionForm(false)} 
                        className="logout-btn" 
                        style={{ margin: 0, padding: '8px 16px', fontSize: '13px' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="dashboard-btn-primary" 
                        style={{ margin: 0, padding: '8px 16px', fontSize: '13px', background: 'var(--accent)' }}
                      >
                        Create Session
                      </button>
                    </div>
                  </form>
                )}

                {showCreateMultiSessionForm && (
                  <form onSubmit={handleCreateMultiSession} className="glass-card" style={{ padding: '20px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px', color: 'white' }}>Create New Multi-Subject Marks Session</h4>
                    
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Exam Title</label>
                      {!showCustomExamMulti ? (
                        <select
                          className="form-select"
                          value={multiSessionForm.examName}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Custom') {
                              setShowCustomExamMulti(true);
                              setMultiSessionForm(prev => ({ ...prev, examName: '' }));
                            } else {
                              setMultiSessionForm(prev => ({ ...prev, examName: val }));
                            }
                          }}
                        >
                          <option value="Annual Exam">Annual Exam</option>
                          <option value="Half Yearly Exam">Half Yearly Exam</option>
                          <option value="Midterm Exam">Midterm Exam</option>
                          <option value="Class Assessment 1">Class Assessment 1</option>
                          <option value="Custom">Custom...</option>
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Annual Exam, Half Yearly Exam"
                            value={multiSessionForm.examName}
                            onChange={(e) => setMultiSessionForm(prev => ({ ...prev, examName: e.target.value }))}
                            required
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              setShowCustomExamMulti(false);
                              setMultiSessionForm(prev => ({ ...prev, examName: 'Annual Exam' }));
                            }}
                            className="logout-btn" 
                            style={{ margin: 0, padding: '8px 12px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span>Subjects & Max Marks</span>
                        <button
                          type="button"
                          onClick={() => {
                            setMultiSessionForm(prev => ({
                              ...prev,
                              subjects: [...prev.subjects, { name: 'Mathematics', totalMarks: 100, isCustom: false }]
                            }));
                          }}
                          className="code-action-btn"
                          style={{ padding: '4px 10px', fontSize: '12px', margin: 0 }}
                        >
                          + Add Subject
                        </button>
                      </label>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {multiSessionForm.subjects.map((sub, sIdx) => (
                          <div key={sIdx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {sub.isCustom ? (
                              <div style={{ display: 'flex', gap: '6px', flex: 2 }}>
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Subject Name"
                                  value={sub.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMultiSessionForm(prev => {
                                      const list = [...prev.subjects];
                                      list[sIdx].name = val;
                                      return { ...prev, subjects: list };
                                    });
                                  }}
                                  required
                                  style={{ flex: 1 }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMultiSessionForm(prev => {
                                      const list = [...prev.subjects];
                                      list[sIdx].isCustom = false;
                                      list[sIdx].name = 'Mathematics';
                                      return { ...prev, subjects: list };
                                    });
                                  }}
                                  className="logout-btn"
                                  style={{ margin: 0, padding: '8px 12px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                                >
                                  Reset
                                </button>
                              </div>
                            ) : (
                              <select
                                className="form-select"
                                value={sub.name}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMultiSessionForm(prev => {
                                    const list = [...prev.subjects];
                                    if (val === 'Custom') {
                                      list[sIdx].isCustom = true;
                                      list[sIdx].name = '';
                                    } else {
                                      list[sIdx].name = val;
                                      list[sIdx].isCustom = false;
                                    }
                                    return { ...prev, subjects: list };
                                  });
                                }}
                                style={{ flex: 2 }}
                              >
                                <option value="Mathematics">Mathematics</option>
                                <option value="Science">Science</option>
                                <option value="English">English</option>
                                <option value="Social Studies">Social Studies</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Hindi">Hindi</option>
                                <option value="Sanskrit">Sanskrit</option>
                                <option value="Art">Art</option>
                                <option value="Custom">Custom...</option>
                              </select>
                            )}
                            
                            <input
                              type="number"
                              className="form-input"
                              placeholder="Max Marks"
                              value={sub.totalMarks}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setMultiSessionForm(prev => {
                                  const list = [...prev.subjects];
                                  list[sIdx].totalMarks = val;
                                  return { ...prev, subjects: list };
                                });
                              }}
                              min={1}
                              required
                              style={{ flex: 1 }}
                            />

                            {multiSessionForm.subjects.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMultiSessionForm(prev => {
                                    const list = [...prev.subjects];
                                    list.splice(sIdx, 1);
                                    return { ...prev, subjects: list };
                                  });
                                }}
                                className="logout-btn"
                                style={{ margin: 0, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button 
                        type="button" 
                        onClick={() => setShowCreateMultiSessionForm(false)} 
                        className="logout-btn" 
                        style={{ margin: 0, padding: '8px 16px', fontSize: '13px' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="dashboard-btn-primary" 
                        style={{ margin: 0, padding: '8px 16px', fontSize: '13px', background: 'var(--accent)' }}
                      >
                        Create Session
                      </button>
                    </div>
                  </form>
                )}

                {examSessions.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px 24px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                    <Award size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: '600', color: 'white' }}>No Exam Marks Sessions Found</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Click the "+ Add Marks Session" button above to log exam grades.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {examSessions.map((session, idx) => (
                      <div 
                        key={idx} 
                        className="glass-card" 
                        style={{ 
                          padding: '20px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'space-between', 
                          gap: '16px', 
                          background: 'rgba(0,0,0,0.15)', 
                          borderColor: 'var(--border)' 
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            {session.isMulti ? (
                              <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                Multi-Subject
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                {session.subject}
                              </span>
                            )}
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {session.isMulti ? `Subjects: ${session.subjects.length}` : `Max: ${session.totalMarks}`}
                            </span>
                          </div>
                          <h4 style={{ margin: '6px 0', fontSize: '17px', color: 'white', fontWeight: 'bold' }}>{session.examName}</h4>
                          {session.isMulti ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '8px 0 12px 0' }}>
                              {session.subjects.map((sub, sIdx) => (
                                <span key={sIdx} style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                  {sub.name} ({sub.totalMarks})
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Graded: <strong>{session.gradedCount}</strong> / {attendanceList.length} Students
                          </span>
                        </div>
                        
                        <button 
                          type="button"
                          onClick={() => {
                            setActiveSession(session);
                            fetchActiveSessionMarks(session);
                          }}
                          className="dashboard-btn-primary"
                          style={{ 
                            background: 'rgba(124, 58, 237, 0.1)',
                            border: '1px solid #7c3aed',
                            color: '#a855f7',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            width: '100%',
                            margin: 0
                          }}
                        >
                          Open Session
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // 2. Active Session View (Student Roster)
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => {
                        setActiveSession(null);
                        setSelectedStudentForMarks(null);
                      }}
                      className="code-action-btn"
                      style={{ margin: 0, padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      ← Back
                    </button>
                    <div>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>{activeSession.examName}</span>
                        {activeSession.isMulti ? (
                          <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                            Multi-Subject Session
                          </span>
                        ) : (
                          <span style={{ fontSize: '13px', background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                            {activeSession.subject}
                          </span>
                        )}
                      </h3>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                        {activeSession.isMulti ? (
                          <span>Subjects: {activeSession.subjects.map(s => `${s.name} (${s.totalMarks})`).join(', ')}</span>
                        ) : (
                          <span>Maximum Marks: <strong>{activeSession.totalMarks}</strong></span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedStudentForMarks ? (
                  // Inline Marks Entry Panel
                  <div className="glass-card" style={{ padding: isMobile ? '16px' : '24px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', maxWidth: '500px', margin: '0 auto' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✍️ Enter Marks for {selectedStudentForMarks.fullName}
                    </h4>
                    
                    <div style={{ background: 'rgba(0,0,0,0.15)', padding: isMobile ? '10px 12px' : '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: isMobile ? '16px' : '20px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Student Details</span>
                      <strong style={{ fontSize: '15px', color: 'white', display: 'block', marginTop: '2px' }}>{selectedStudentForMarks.fullName}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedStudentForMarks.email}</span>
                    </div>

                    {activeSession.isMulti ? (
                      activeSession.subjects.map((sub, sIdx) => (
                        <div key={sIdx} className="form-group" style={{ marginBottom: '16px' }}>
                          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ fontWeight: '600', color: 'white' }}>{sub.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>Max Marks: {sub.totalMarks}</span>
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Score"
                              value={tempStudentMark[sub.name] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTempStudentMark(prev => ({
                                  ...prev,
                                  [sub.name]: val
                                }));
                              }}
                              style={{ margin: 0, textAlign: 'center', fontSize: '16px', fontWeight: 'bold', width: '120px', minWidth: '120px', flex: '0 0 120px' }}
                              required
                            />
                            <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>/ {sub.totalMarks}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="form-group" style={{ marginBottom: isMobile ? '16px' : '20px' }}>
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span>Obtained Score</span>
                          <span style={{ color: 'var(--text-muted)' }}>Max Marks: {activeSession.totalMarks}</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Score"
                            value={tempStudentMark}
                            onChange={(e) => setTempStudentMark(e.target.value)}
                            style={{ margin: 0, textAlign: 'center', fontSize: '16px', fontWeight: 'bold', width: '120px', minWidth: '120px', flex: '0 0 120px' }}
                            required
                          />
                          <span style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '600', whiteSpace: 'nowrap' }}>/ {activeSession.totalMarks}</span>
                        </div>
                      </div>
                    )}

                    {/* Real-time Percentage & Grade calculation */}
                    {activeSession.isMulti ? (
                      (() => {
                        let totalObtained = 0;
                        let totalMax = 0;
                        let validCount = 0;
                        activeSession.subjects.forEach(sub => {
                          const val = tempStudentMark[sub.name];
                          if (val !== undefined && val !== null && val !== '' && !isNaN(val)) {
                            totalObtained += Number(val);
                            totalMax += sub.totalMarks;
                            validCount += 1;
                          }
                        });
                        
                        if (validCount > 0) {
                          const pct = Math.round((totalObtained / totalMax) * 100);
                          return (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '8px 12px' : '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: isMobile ? '16px' : '20px' }}>
                              <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Calculated Cumulative Grade:</span>
                              <strong style={{ color: pct >= 50 ? '#34d399' : '#f87171', fontSize: '14px' }}>
                                {pct}% ({pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'})
                              </strong>
                            </div>
                          );
                        }
                        return null;
                      })()
                    ) : (
                      tempStudentMark !== '' && !isNaN(tempStudentMark) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '8px 12px' : '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: isMobile ? '16px' : '20px' }}>
                          <span style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>Calculated Grade:</span>
                          {(() => {
                            const pct = Math.round((Number(tempStudentMark) / activeSession.totalMarks) * 100);
                            return (
                              <strong style={{ color: pct >= 50 ? '#34d399' : '#f87171', fontSize: '14px' }}>
                                {pct}% ({pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F'})
                              </strong>
                            );
                          })()}
                        </div>
                      )
                    )}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: isMobile ? '16px' : '20px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedStudentForMarks(null)}
                        className="logout-btn"
                        style={{ margin: 0, padding: '10px 18px', fontSize: '13px' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSingleMarkSubmit(selectedStudentForMarks.studentId, tempStudentMark)}
                        className="dashboard-btn-primary"
                        style={{ margin: 0, padding: '10px 18px', fontSize: '13px', background: 'var(--accent)' }}
                      >
                        Save Marks
                      </button>
                    </div>
                  </div>
                ) : (
                  // Student Roster List
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {studentMarksList.map((student) => {
                      let pct = null;
                      let displayScore = 'Not Graded Yet';
                      
                      if (activeSession.isMulti) {
                        let totalObtained = 0;
                        let totalMax = 0;
                        let subjectsCount = 0;
                        
                        activeSession.subjects.forEach(sub => {
                          const scoreVal = student.marksObtained?.[sub.name];
                          if (scoreVal !== undefined && scoreVal !== null && scoreVal !== '' && !isNaN(scoreVal)) {
                            totalObtained += Number(scoreVal);
                            totalMax += sub.totalMarks;
                            subjectsCount += 1;
                          }
                        });
                        
                        if (subjectsCount > 0) {
                          pct = Math.round((totalObtained / totalMax) * 100);
                          displayScore = `${totalObtained} / ${totalMax} (${pct}%)`;
                        }
                      } else {
                        const pctVal = student.marksObtained !== '' && !isNaN(student.marksObtained)
                          ? Math.round((Number(student.marksObtained) / activeSession.totalMarks) * 100)
                          : null;
                        if (pctVal !== null) {
                          pct = pctVal;
                          displayScore = `${student.marksObtained} / ${activeSession.totalMarks} (${pct}%)`;
                        }
                      }
                      
                      return (
                        <div
                          key={student.studentId}
                          onClick={() => {
                            setSelectedStudentForMarks(student);
                            setTempStudentMark(student.marksObtained);
                          }}
                          className="glass-card"
                          style={{
                            padding: '16px 20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '16px',
                            flexWrap: 'wrap',
                            cursor: 'pointer',
                            borderLeft: pct !== null ? (pct >= 50 ? '4px solid #10b981' : '4px solid #ef4444') : '4px solid var(--border)',
                            transition: 'all 0.25s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
                            <div style={{ minWidth: '120px', textAlign: 'right' }}>
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
                                  {displayScore}
                                </span>
                              ) : (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{displayScore}</span>
                              )}
                            </div>
                            
                            <button
                              type="button"
                              className="code-action-btn"
                              style={{ margin: 0, padding: '6px 12px', fontSize: '12px' }}
                            >
                              ✍️ Enter Marks
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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

      {activeTab === 'leaves' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Student Leave Applications</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Review and approve/reject leave requests submitted by parents of class students.
              </p>
            </div>
            <button 
              onClick={fetchLeaves} 
              className="code-action-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}
              disabled={loadingLeaves}
            >
              <RefreshCw size={14} className={loadingLeaves ? 'spin-anim' : ''} />
              <span>Refresh List</span>
            </button>
          </div>

          {loadingLeaves ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Loading leave applications...
            </div>
          ) : leavesList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No leave requests found for your class.
            </div>
          ) : (
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Parent / Student</th>
                    <th>Dates</th>
                    <th>Leave Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leavesList.map((req) => (
                    <tr key={req._id}>
                      <td>
                        <strong>{req.parent?.fullName || 'Parent'}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Parent Account
                        </div>
                      </td>
                      <td><strong>{req.startDate} to {req.endDate}</strong></td>
                      <td>
                        <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                          {req.leaveType}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>{req.reason}</td>
                      <td>
                        <span className={`badge ${req.status === 'Approved' ? 'badge-active' : req.status === 'Rejected' ? 'badge-role driver' : 'badge-role teacher'}`} style={{ fontWeight: 'bold' }}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        {req.status === 'Pending' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => handleApproveLeave(req._id)}
                              className="code-action-btn"
                              style={{ 
                                margin: 0, 
                                background: 'rgba(16, 185, 129, 0.1)', 
                                border: '1px solid rgba(16, 185, 129, 0.3)', 
                                color: '#10b981', 
                                padding: '6px 12px',
                                fontSize: '12px'
                              }}
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectLeave(req._id)}
                              className="logout-btn"
                              style={{ 
                                margin: 0, 
                                padding: '6px 12px',
                                fontSize: '12px'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <LogoutConfirmationModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={confirmLogout} 
      />
      {activeTab === 'messages' && (
        <div className="glass-card" style={{ padding: 0, display: 'flex', height: '600px', overflow: 'hidden', minHeight: '500px' }}>
          {/* Sidebar - Parent List */}
          {(!isMobile || !selectedParentId) && (
            <div style={{ width: isMobile ? '100%' : '300px', borderRight: isMobile ? 'none' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                <h4 style={{ margin: 0 }}>Class Parents</h4>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select a parent to message</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {attendanceList.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No parents found. Load Class Attendance to populate the class list.
                  </div>
                ) : (
                  attendanceList.map(parent => {
                    const isSelected = selectedParentId === parent.studentId;
                    return (
                      <div
                        key={parent.studentId}
                        onClick={() => setSelectedParentId(parent.studentId)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--accent-glow)' : 'transparent',
                          borderBottom: '1px solid var(--border)',
                          transition: 'all 0.2s ease',
                          borderLeft: isSelected ? '4px solid var(--accent)' : '4px solid transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {parent.fullName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {parent.email}
                          </div>
                        </div>
                        {unreadCounts[parent.studentId] > 0 && (
                          <div style={{
                            background: '#EF4444',
                            color: 'white',
                            borderRadius: '10px',
                            minWidth: '20px',
                            height: '20px',
                            padding: '0 6px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
                          }}>
                            {unreadCounts[parent.studentId]}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Chat Window */}
          {(!isMobile || selectedParentId) && (
            <div style={{ flex: 1, display: selectedParentId || !isMobile ? 'flex' : 'none', flexDirection: 'column', background: 'transparent' }}>
              {selectedParentId ? (
                <>
                  {/* Chat Header */}
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isMobile && (
                        <button
                          type="button"
                          onClick={() => setSelectedParentId('')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-primary)',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '4px 8px 4px 0',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          ←
                        </button>
                      )}
                      <div>
                        <h4 style={{ margin: 0 }}>
                          {attendanceList.find(p => p.studentId === selectedParentId)?.fullName || 'Parent'}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Direct communication channel
                        </span>
                      </div>
                    </div>
                    {/* Quick Action Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <select
                        className="form-select"
                        value={selectedExamProgress}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Custom') {
                            setShowCustomExamProgress(true);
                            setSelectedExamProgress('Custom');
                          } else {
                            setShowCustomExamProgress(false);
                            setSelectedExamProgress(val);
                          }
                        }}
                        style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', cursor: 'pointer', margin: 0, height: '32px' }}
                      >
                        <option value="All">All Progress (Cumulative)</option>
                        <option value="Midterm Exam">Midterm Exam</option>
                        <option value="Class Assessment 1">Class Assessment 1</option>
                        <option value="Custom">Custom...</option>
                      </select>

                      {showCustomExamProgress && (
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Exam Name (e.g. Term 1)"
                          value={customExamProgressText}
                          onChange={(e) => setCustomExamProgressText(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', width: '130px', margin: 0, height: '32px' }}
                        />
                      )}

                      <button
                        type="button"
                        onClick={handleSendStudentProgress}
                        className="code-action-btn"
                        style={{
                          fontSize: '12px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          margin: 0,
                          cursor: 'pointer',
                          background: 'var(--accent-glow)',
                          border: '1.5px solid var(--accent)',
                          color: 'var(--accent)',
                          fontWeight: '600',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        📊 Send Student Progress
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {teacherChatMessages.map(msg => (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: msg.sender === 'teacher' ? 'flex-end' : 'flex-start',
                          background: msg.sender === 'teacher' ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 8%, var(--bg-card))',
                          color: msg.sender === 'teacher' ? 'white' : 'var(--text-primary)',
                          padding: '12px 16px',
                          borderRadius: msg.sender === 'teacher' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                          maxWidth: '75%',
                          border: msg.sender === 'teacher' ? 'none' : '1px solid var(--border)',
                          boxShadow: 'var(--shadow)',
                          whiteSpace: 'pre-line'
                        }}
                      >
                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>{msg.text}</p>
                        {msg.linkToTab === 'marks' && (
                          <div
                            style={{
                              marginTop: '10px',
                              background: msg.sender === 'teacher' ? 'rgba(255,255,255,0.2)' : 'var(--accent)',
                              color: 'white',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              border: '1px solid rgba(255,255,255,0.3)'
                            }}
                          >
                            🔗 Linked to Marks Tab
                          </div>
                        )}
                        <span style={{ fontSize: '10px', color: msg.sender === 'teacher' ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', display: 'block', marginTop: '4px', textAlign: 'right' }}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Send Box */}
                  <form onSubmit={handleTeacherSendMessage} style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border)', padding: '16px' }}>
                    <input
                      type="text"
                      value={teacherChatInput}
                      onChange={(e) => setTeacherChatInput(e.target.value)}
                      placeholder="Type a message to the parent..."
                      className="form-input"
                      style={{ flex: 1, margin: 0 }}
                    />
                    <button type="submit" className="dashboard-btn-primary" style={{ margin: 0 }}>
                      Send
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>
                  <Mail size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <h4>No Parent Selected</h4>
                  <p style={{ fontSize: '13px', maxWidth: '300px', margin: '4px 0 0 0' }}>
                    Select a parent from the sidebar list to view chat logs and send direct messages or progress updates.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
