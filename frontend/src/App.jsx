import React, { useEffect, useMemo, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Bell,
  ChevronRight,
  Download,
  Files,
  Folder,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Search,
  Sun,
  Users,
  Video,
  BarChart3,
  ClipboardList,
  MessageCircle,
  Settings,
  MoreVertical,
  Eye,
  Trash2,
  Pencil,
  EyeOff,
  User,
} from "lucide-react";

import { motion } from "framer-motion";

import { login, getMe, logout, register, updateMe, changePassword, updateUser, requestPasswordReset, confirmPasswordReset, getAdminMetrics, getTeacherTaskControl, } from "./auth";
import { getProjects, createProject, inviteToProject, updateProject, deleteProject } from "./projectsApi";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  selfAssignTask,
  cancelSelfAssignTask,
} from "./tasksApi";
import {
  getSubmissions,
  createSubmission,
  updateSubmission,
  createSubmissionFile,
  deleteSubmissionFile,
  deleteSubmission,
  reviewSubmission,
} from "./submissionsApi";
import { getComments, createComment, updateComment, deleteComment } from "./commentsApi";
import {
  getProjectFolders,
  getProjectFiles,
  createProjectFile,
  deleteProjectFile,
  createProjectFolder,
  updateProjectFolder,
  deleteProjectFolder,
  updateProjectFile,
} from "./projectFilesApi";
import { getNotifications } from "./notificationsApi";
import { getProjectActivities } from "./projectActivitiesApi";
import { getMeetings, createMeeting, deleteMeeting } from "./meetingsApi";
import { getProjectMembers, deleteProjectMember, updateProjectMember } from "./projectMembersApi";
import html2canvas from "html2canvas";
import {
  downloadProjectReport,
  downloadProjectPassportTemplate,
} from "./reportsApi";
import { getProjectChatMessages, createProjectChatMessage } from "./projectChatApi";
import { getGrades, createGrade, updateGrade, deleteGrade } from './gradesApi';
import {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  deleteAttendanceDate,
} from "./attendanceApi";


const menu = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "tasks", label: "Задачи", icon: ClipboardList },
  { id: "files", label: "Файлы", icon: Files },
  { id: "meetings", label: "Созвоны", icon: Video },
  { id: "gantt", label: "Гант", icon: BarChart3 },
  { id: "members", label: "Участники", icon: Users },
  { id: "reports", label: "Отчёты", icon: Download },
  { id: "chat", label: "Чат", icon: MessageCircle },
  { id: "teacherPanel", label: "Панель преподавателя", icon: Settings },
];

function statusClass(status) {
  switch (status) {
    case "Принято":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "Нужна проверка":
      return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300";
    case "Отклонено":
      return "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300";
    case "В работе":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
    case "Просрочено":
      return "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

function getFileName(path) {
  if (!path) return 'Файл'

  const name = decodeURIComponent(path.split('/').pop())
  return name.replace(/^.*?_/, '')
}

function taskStatusLabel(status) {
  switch (status) {
    case 'created':
      return 'Создано'
    case 'in_progress':
      return 'В работе'
    case 'review':
      return 'Нужна проверка'
    case 'accepted':
      return 'Принято'
    case 'rejected':
      return 'Отклонено'
    default:
      return status || 'Без статуса'
  }
}


function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {children}
    </div>
  );
}

function ConfirmModal({
  title,
  text,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h3 className="text-xl font-bold">{title}</h3>

        {text && (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {text}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            {confirmText}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}

function AlertModal({
  title = 'Уведомление',
  text,
  type = 'info',
  onClose,
}) {
  const isError = type === 'error'
  const isSuccess = type === 'success'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h3 className="text-xl font-bold">{title}</h3>

        {text && (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {text}
          </p>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white ${
              isError
                ? 'bg-red-600 hover:bg-red-700'
                : isSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  )
}

function showAppAlert(text, type = 'info', title) {
  window.dispatchEvent(
    new CustomEvent('app-alert', {
      detail: {
        title:
          title ||
          (type === 'error'
            ? 'Ошибка'
            : type === 'success'
              ? 'Успешно'
              : 'Уведомление'),
        text,
        type,
      },
    })
  )
}

export default function UniversityProjectManagerPrototype() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authMode, setAuthMode] = useState('login')
  const resetMatch = window.location.pathname.match(
    /^\/reset-password\/([^/]+)\/([^/]+)\/?$/
  )

  const [theme, setTheme] = useState("light");
  const navigate = useNavigate();
  const location = useLocation();
  const [activeProject, setActiveProject] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [projectList, setProjectList] = useState([])
  const [projectCreateOpen, setProjectCreateOpen] = useState(false)
  const [taskList, setTaskList] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [folderList, setFolderList] = useState([])
  const [projectFileList, setProjectFileList] = useState([])
  const [notificationList, setNotificationList] = useState([])
  const [activityList, setActivityList] = useState([])
  const [meetingList, setMeetingList] = useState([])
  const [memberList, setMemberList] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [appAlertModal, setAppAlertModal] = useState(null)

  useEffect(() => {
    function handleAppAlert(event) {
      setAppAlertModal(event.detail)
    }

    window.addEventListener('app-alert', handleAppAlert)

    return () => {
      window.removeEventListener('app-alert', handleAppAlert)
    }
  }, [])


  useEffect(() => {
    const token = localStorage.getItem('access')

    if (!token) {
      setLoading(false)
      return
    }

    getMe()
      .then((data) => {
        setUser(data)
      })
      .catch(() => {
        localStorage.removeItem('access')
        localStorage.removeItem('refresh')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!user) return

    getProjects()
      .then((data) => {
        setProjectList(data)
      })
      .catch((error) => {
        console.log('Ошибка загрузки проектов:', error)
      })
  }, [user])

  useEffect(() => {
    const projectMatch = location.pathname.match(/^\/projects\/(\d+)/)
    const projectIdFromUrl = projectMatch?.[1]

    if (!projectIdFromUrl) {
      if (!activeProject && projectList.length > 0) {
        setActiveProject(projectList[0])
      }

      return
    }

    if (!projectList.length) return

    const foundProject = projectList.find(
      (project) => String(project.id) === String(projectIdFromUrl)
    )

    if (foundProject) {
      setActiveProject(foundProject)
      return
    }

    setActiveProject(null)
    navigate("/projects", { replace: true })
  }, [location.pathname, projectList, activeProject, navigate])

  useEffect(() => {
    const projectPathMatch = location.pathname.match(
      /^\/projects\/\d+(?:\/(overview|tasks|files|meetings|gantt|members|reports|chat|teacher))?(?:\/(\d+))?/
    )

    const tabFromUrl = projectPathMatch?.[1] || 'overview'

    if (tabFromUrl === 'teacher') {
      setActiveTab('teacherPanel')
    } else {
      setActiveTab(tabFromUrl)
    }

    const taskIdFromUrl =
      tabFromUrl === 'tasks'
        ? location.pathname.match(/^\/projects\/\d+\/tasks\/(\d+)/)?.[1]
        : null

    if (!taskIdFromUrl) {
      setSelectedTask(null)
      return
    }

    const foundTask = taskList.find(
      (task) => String(task.id) === String(taskIdFromUrl)
    )

    setSelectedTask(foundTask || null)
  }, [location.pathname, taskList])

  useEffect(() => {
    if (!activeProject) return

    getTasks(activeProject.id)
      .then((data) => {
        setTaskList(data)
      })
      .catch((error) => {
        console.log('Ошибка загрузки задач:', error)
      })
  }, [activeProject])

  useEffect(() => {
    if (!activeProject) return

    getProjectFolders(activeProject.id)
      .then((data) => setFolderList(data))
      .catch((error) => console.log('Ошибка загрузки папок:', error))

    getProjectFiles(activeProject.id)
      .then((data) => setProjectFileList(data))
      .catch((error) => console.log('Ошибка загрузки файлов проекта:', error))
  }, [activeProject])

  useEffect(() => {
    if (!user) return

    getNotifications()
      .then((data) => setNotificationList(data))
      .catch((error) => console.log('Ошибка загрузки уведомлений:', error))
  }, [user])

  useEffect(() => {
    if (!activeProject) return

    getProjectActivities(activeProject.id)
      .then((data) => setActivityList(data))
      .catch((error) => console.log('Ошибка загрузки активности проекта:', error))
  }, [activeProject])

  useEffect(() => {
    if (!activeProject) return

    getMeetings(activeProject.id)
      .then((data) => setMeetingList(data))
      .catch((error) => console.log('Ошибка загрузки созвонов:', error))
  }, [activeProject])

  useEffect(() => {
    if (!activeProject) return

    getProjectMembers(activeProject.id)
      .then((data) => setMemberList(data))
      .catch((error) => console.log('Ошибка загрузки участников:', error))
  }, [activeProject])

  function handleLogout() {
    logout()
    setUser(null)
    setActiveProject(null)
    navigate("/login", { replace: true })
  }

  function isTeacherOrAdmin() {
    return user?.role === 'teacher' || user?.role === 'admin'
  }

  function isAdmin() {
    return user?.role === 'admin'
  }

  const isDark = theme === "dark";

  const pageTitle = useMemo(() => {
    return activeProject?.title || "Мои проекты";
  }, [activeProject]);

  function openProject(project) {
    setActiveProject(project);
    navigate(`/projects/${project.id}/overview`);
    setActiveTab("overview");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-xl">
        Загрузка...
      </div>
    )
  }

  if (resetMatch) {
    return (
      <ResetPasswordScreen
        uid={resetMatch[1]}
        token={resetMatch[2]}
      />
    )
  }

  const redirectAfterLogin = location.state?.from?.pathname || "/projects"

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/projects" replace />
          ) : authMode === "login" ? (
            <LoginScreen
              onLogin={(loggedUser) => {
                setUser(loggedUser)
                navigate(redirectAfterLogin, { replace: true })
              }}
              onSwitchToRegister={() => setAuthMode("register")}
            />
          ) : (
            <RegisterScreen
              onRegisterSuccess={() => setAuthMode("login")}
              onSwitchToLogin={() => setAuthMode("login")}
            />
          )
        }
      />

      <Route
        path="/register"
        element={
          user ? (
            <Navigate to="/projects" replace />
          ) : (
            <RegisterScreen
              onRegisterSuccess={() => {
                setAuthMode("login")
                navigate("/login", { replace: true })
              }}
              onSwitchToLogin={() => {
                setAuthMode("login")
                navigate("/login", { replace: true })
              }}
            />
          )
        }
      />

      <Route
        path="/*"
        element={
          user ? (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-[#F6F7FB] text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex h-20 items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-300">
                <LayoutDashboard size={22} />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">Project Manager</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Управление учебными проектами</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Bell size={18} />
                </button>

                {notificationsOpen && (
                <div className="fixed right-8 top-24 z-50 w-[420px] rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-3 font-bold">Уведомления</div>

                    <div className="max-h-80 space-y-3 overflow-auto">
                      {notificationList.length > 0 ? (
                        notificationList.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-800/70"
                          >
                            <div className="font-semibold">
                              {item.title}
                            </div>

                            <div className="mt-1 text-slate-500 dark:text-slate-400">
                              {item.text}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                          Уведомлений пока нет.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {user?.role === 'admin' && (
                <a
                  href="http://127.0.0.1:8000/admin/"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Django admin
                </a>
              )}

              <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-left hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 md:flex"
                >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-300">
                  <User size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <div className="text-sm font-semibold">
                    {user.full_name || user.username || 'Пользователь'}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {roleLabel(user.role)}
                  </div>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                title="Выйти"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="px-8 py-8">
          
          <Routes>

            <Route
              path="/projects"
              element={
                <ProjectsScreen
                  pageTitle={pageTitle}
                  projects={projectList}
                  onOpenProject={openProject}
                  onLogout={handleLogout}
                  user={user}
                  onProjectCreated={(project) => {
                    setProjectList((prev) => [project, ...prev])
                    setProjectCreateOpen(false)
                  }}
                  projectCreateOpen={projectCreateOpen}
                  setProjectCreateOpen={setProjectCreateOpen}
                />
              }
            />

            <Route
              path="/profile"
              element={
                <ProfilePage
                  user={user}
                  projects={projectList}
                  tasks={taskList}
                  onUserUpdate={setUser}
                  goBack={() => navigate("/projects")}
                />
              }
            />

            <Route
              path="/projects/:id/*"
              element={
                activeProject ? (
                  <ProjectScreen
                    project={activeProject}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    goBack={() => navigate("/projects")}
                    tasks={taskList}
                    selectedTask={selectedTask}
                    setSelectedTask={setSelectedTask}
                    folders={folderList}
                    projectFiles={projectFileList}
                    setProjectFiles={setProjectFileList}
                    onLogout={handleLogout}
                    setFolders={setFolderList}
                    notifications={notificationList}
                    activities={activityList}
                    meetings={meetingList}
                    setMeetings={setMeetingList}
                    members={memberList}
                    setMembers={setMemberList}
                    user={user}
                    setTasks={setTaskList}
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    Проект не найден
                  </div>
                )
              }
            />

            <Route
              path="*"
              element={<Navigate to="/projects" replace />}
            />

                    </Routes>

          {appAlertModal && (
            <AlertModal
              title={appAlertModal.title}
              text={appAlertModal.text}
              type={appAlertModal.type}
              onClose={() => setAppAlertModal(null)}
            />
          )}
        </main>
      </div>
    </div>
          ) : (
            <Navigate to="/login" replace state={{ from: location }} />
          )
        }
      />
    </Routes>
  );

}

function ResetPasswordScreen({ uid, token }) {
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!password || !passwordRepeat) {
      setError('Введите новый пароль дважды')
      return
    }

    if (password !== passwordRepeat) {
      setError('Пароли не совпадают')
      return
    }

    try {
      await confirmPasswordReset(uid, token, password)
      setSuccess(true)
      setError('')
    } catch (error) {
      setError('Не удалось изменить пароль. Возможно, ссылка устарела.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] px-4">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-center text-3xl font-bold">
          Новый пароль
        </h1>

        <p className="mt-3 text-center text-slate-500">
          Придумайте новый пароль для входа в Project Manager.
        </p>

        {success ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Пароль успешно изменён.
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = '/'
              }}
              className="w-full rounded-2xl bg-violet-600 px-4 py-4 font-semibold text-white hover:bg-violet-700"
            >
              Вернуться ко входу
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block font-medium">
                Новый пароль
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-violet-500"
                placeholder="Введите новый пароль"
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">
                Повторите пароль
              </label>

              <input
                type="password"
                value={passwordRepeat}
                onChange={(e) => {
                  setPasswordRepeat(e.target.value)
                  setError('')
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-4 outline-none focus:border-violet-500"
                placeholder="Повторите новый пароль"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-violet-600 px-4 py-4 font-semibold text-white hover:bg-violet-700"
            >
              Сохранить пароль
            </button>
          </form>
        )}
      </div>
    </div>
  )
}


function Progress({ value }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          Прогресс
        </span>

        <span className="font-semibold text-slate-800 dark:text-slate-100">
          {value || 0}%
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-2 rounded-full bg-violet-500"
          style={{ width: `${value || 0}%` }}
        />
      </div>
    </div>
  )
}

function AdminMetricBar({ label, value, total }) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          {label}
        </span>

        <span className="font-semibold">
          {value} / {total}
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-2 rounded-full bg-violet-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function ProjectsScreen({
  pageTitle,
  projects,
  onOpenProject,
  onLogout,
  user,
  onProjectCreated,
  projectCreateOpen,
  setProjectCreateOpen,
}) {
  projects = projects || []
  
  const [projectSearch, setProjectSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('active')

  const visibleProjects = projects.filter((project) => {
    const matchesSearch =
      project.title?.toLowerCase().includes(projectSearch.toLowerCase())

    const isArchived =
      project.status === 'archived' ||
      project.status === 'completed'

    const matchesFilter =
      projectFilter === 'active'
        ? !isArchived
        : isArchived

    return matchesSearch && matchesFilter
  })

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Мои проекты</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Проекты, в которых вы участвуете или которыми руководите.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <Search size={18} className="text-slate-400" />
            <input
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="w-48 bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder="Поиск проекта"
            />
          </div>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <button
              type="button"
              onClick={() => setProjectCreateOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
            >
              <Plus size={18} /> Новый проект
            </button>
          )}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setProjectFilter('active')}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              projectFilter === 'active'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Активные проекты
          </button>

          <button
            type="button"
            onClick={() => setProjectFilter('archived')}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              projectFilter === 'archived'
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Архив проектов
          </button>
        </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleProjects.length > 0 ? (
          visibleProjects.map((project) => (
            <motion.button
              key={project.id}
              onClick={() => onOpenProject(project)}
              whileHover={{ y: -4 }}
              className="text-left"
            >
              <Card className="p-6 transition hover:border-violet-200 hover:shadow-md dark:hover:border-violet-900">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="line-clamp-2 text-lg font-bold leading-snug">
                      {project.title}
                    </h2>
                  </div>

                  <ChevronRight className="mt-1 text-slate-400" size={20} />
                </div>

                <Progress value={project.progress || 0} />

                <div className="mt-5 flex items-end justify-between gap-4 text-sm">
                  <span className="rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                    {project.status_display || project.status}
                  </span>

                  <div className="text-right">
                    <div className="text-slate-500 dark:text-slate-400">
                      Конец проекта
                    </div>

                    <div className="font-semibold">
                      {project.end_date
                        ? new Date(project.end_date).toLocaleDateString('ru-RU')
                        : 'Не указан'}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.button>
          ))
        ) : (
          <div className="col-span-full flex min-h-[45vh] flex-col items-center justify-center text-center">
            <div className="text-2xl font-bold">
              Проекты не найдены
            </div>

            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Попробуйте изменить поисковый запрос.
            </div>
          </div>
        )}
      </div>

      {projectCreateOpen && (
        <CreateProjectModal
          user={user}
          onClose={() => setProjectCreateOpen(false)}
          onCreated={onProjectCreated}
        />
      )}

    </div>
  );
}

function ProjectScreen({
  project,
  activeTab,
  setActiveTab,
  goBack,
  tasks,
  setTasks,
  selectedTask,
  setSelectedTask,
  folders,
  projectFiles,
  setProjectFiles,
  onLogout,
  notifications,
  activities,
  meetings,
  setMeetings,
  members,
  user,
  setMembers,
  setFolders
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const ActiveIcon = menu.find((item) => item.id === activeTab)?.icon || LayoutDashboard;
  const currentMember = members.find(
  (member) => member.user === user.id
  )

  const canManageTasks =
    user?.role === 'admin' ||
    user?.role === 'teacher' ||
    currentMember?.role === 'Тимлид'

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button onClick={goBack} className="mb-4 flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
          <ChevronRight className="rotate-180" size={18} /> К проектам
        </button>
        <div className="mb-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
          <div className="text-sm text-slate-500 dark:text-slate-400">Текущий проект</div>
          <div className="mt-1 text-sm font-bold leading-snug">{project.title}</div>
        </div>
        <nav className="space-y-1">
          {menu
            .filter((item) => {
              if (item.id === 'teacherPanel') {
                return user?.role === 'teacher' || user?.role === 'admin'
              }

              return true
            })
            .map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'teacherPanel') {
                      navigate(`/projects/${project.id}/teacher/members`)
                    } else {
                      navigate(`/projects/${project.id}/${item.id}`)
                    }
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
        </nav>
      </aside>

      <section>
        <Card className="mb-6 p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-300">
                <ActiveIcon size={18} /> {menu.find((item) => item.id === activeTab)?.label}
              </div>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight">{project.title}</h1>
             <p className="mt-3 max-w-3xl text-slate-500 dark:text-slate-400">{project.description}</p>
            </div>
            <div className="w-full rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
              <Progress value={project.progress} />
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Руководитель</div>
                  <div className="font-semibold">{project.supervisor_name || project.supervisor}</div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Дедлайн</div>
                  <div className="font-semibold">{project.end_date ? new Date(project.end_date).toLocaleDateString('ru-RU') : 'не указан'}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {activeTab === "overview" && (
          <Overview
            tasks={tasks}
            activities={activities}
            onOpenTask={(task) => {
              setSelectedTask(task)
              navigate(`/projects/${project.id}/tasks/${task.id}`)
            }}
          />
        )}
        {activeTab === "chat" && (
          <ProjectChat project={project} user={user} />
        )}
        {activeTab === "tasks" && (
          selectedTask ? (
            <TaskDetails
              task={selectedTask}
              user={user}
              setTask={setSelectedTask}
              members={members}
              setTasks={setTasks}
              onBack={() => {
                setSelectedTask(null)
                navigate(`/projects/${project.id}/tasks`)
              }}
              onEdit={() => {
                setEditingTask(selectedTask)
                setTaskModalOpen(true)
              }}
              onDelete={() => handleDeleteTask(selectedTask.id)}
            />
          ) : (
            <Tasks
              project={project}
              tasks={tasks}
              onOpenTask={(task) => {
                setSelectedTask(task)
                navigate(`/projects/${project.id}/tasks/${task.id}`)
              }}
              user={user}
              members={members}
              canManageTasks={canManageTasks}
            />
          )
        )}
        {activeTab === "files" && (
          <FilesView
            project={project}
            folders={folders}
            setFolders={setFolders}
            projectFiles={projectFiles}
            setProjectFiles={setProjectFiles}
          />
        )}
        {activeTab === "meetings" && (
          <Meetings
            project={project}
            meetings={meetings}
            setMeetings={setMeetings}
          />
        )}
        {activeTab === "gantt" && (
          <Gantt tasks={tasks} />
        )}
        {activeTab === "members" && (
          <Members
            members={members}
            supervisor={project.supervisor_name || project.supervisor}
          />
        )}
        {activeTab === "reports" && <Reports project={project} />}
        {activeTab === "teacherPanel" && (user?.role === 'teacher' || user?.role === 'admin') && (
          <TeacherPanel
            project={project}
            members={members}
            setMembers={setMembers}
            tasks={tasks}
            user={user}
            setActiveTab={setActiveTab}
            setSelectedTask={setSelectedTask}
          />
        )}
      </section>
    </div>
  );
}

function CreateProjectModal({ user, onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    if (!title.trim()) {
      setError('Введите название проекта')
      return
    }

    setSaving(true)
    setError('')

    try {
      const created = await createProject({
        title: title.trim(),
        description,
        start_date: startDate || null,
        end_date: endDate || null,
        status: 'created',
        supervisor: user.id,
      })
      onCreated(created)
    } catch (error) {
      console.log('Ошибка создания проекта:', error.response?.data || error)
      setError('Не удалось создать проект')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h3 className="text-xl font-bold">Новый проект</h3>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Название проекта"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Описание проекта"
          />

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? 'Создание...' : 'Создать проект'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Overview({ tasks = [], activities = [], onOpenTask }) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="p-6 xl:col-span-2">
        <h2 className="mb-4 text-xl font-bold">Ближайшие задачи</h2>
        <div className="space-y-3">
          {tasks
            .filter((task) =>
              ['created', 'in_progress', 'review'].includes(task.status)
            )
            .slice(0, 5)
            .length > 0 ? (
              tasks
                .filter((task) =>
                  ['created', 'in_progress', 'review'].includes(task.status)
                )
                .slice(0, 5)
                .map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onClick={() => onOpenTask(task)}
                  />
                ))
            ) : (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                Активных задач пока нет.
              </div>
            )}
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="mb-4 text-xl font-bold">Активность проекта</h2>
          <div className="max-h-[520px] space-y-4 overflow-y-auto pr-2">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <Notice
                  key={activity.id}
                  title={activity.title}
                  text={activity.text}
                  createdAt={activity.created_at}
                />
              ))
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Активности пока нет.
              </div>
            )}
          </div>
      </Card>
    </div>
  );
}

function Notice({ title, text, createdAt }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</div>
      {createdAt && (
        <div className="mt-2 text-xs text-slate-400">
          {new Date(createdAt).toLocaleString('ru-RU')}
        </div>
      )}
    </div>
  );
}

function Tasks({ project, tasks = [], onOpenTask, members = [], canManageTasks }) {
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignee, setAssignee] = useState('')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [isOpenForSelfAssign, setIsOpenForSelfAssign] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)

  async function handleCreateTask(e) {
    e.preventDefault()

    if (!title.trim()) return

    const payload = {
      project: project.id,
      title: title.trim(),
      description,
      start_date: startDate
        ? startDate.slice(0, 10)
        : null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      assignee: isOpenForSelfAssign ? null : assignee || null,
      is_open_for_self_assign: isOpenForSelfAssign,
    }

    if (!isOpenForSelfAssign && assignee) {
      payload.assignee = Number(assignee)
    }

    if (editingTask) {
      await updateTask(editingTask.id, payload)
    } else {
      await createTask(payload)
    }

    window.location.reload()

    setTitle('')
    setDescription('')
    setAssignee('')
    setStartDate('')
    setDeadline('')
    setIsOpenForSelfAssign(false)
    setShowTaskForm(false)
  }

  function startEditTask(task) {
    setEditingTask(task)

    setTitle(task.title || '')
    setDescription(task.description || '')
    setAssignee(task.assignee || '')
    setStartDate(task.start_date || '')
    setDeadline(task.deadline ? task.deadline.slice(0, 16) : '')
    setIsOpenForSelfAssign(task.is_open_for_self_assign || false)
    setShowTaskForm(true)
  }

  async function handleDeleteTask() {
    if (!taskToDelete) return

    await deleteTask(taskToDelete.id)

    window.location.reload()
  }
  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <h2 className="text-xl font-bold">Задачи проекта</h2>
        {canManageTasks && (
          <button
            onClick={() => {
              setEditingTask(null)
              setTitle('')
              setDescription('')
              setAssignee('')
              setStartDate('')
              setDeadline('')
              setIsOpenForSelfAssign(false)
              setShowTaskForm(true)
            }}
            className="flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <Plus size={18} /> Создать задачу
          </button>
        )}
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">
                {editingTask ? 'Изменить задачу' : 'Создать задачу'}
              </h3>

              <button
                type="button"
                onClick={() => {
                  setShowTaskForm(false)
                  setEditingTask(null)
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Закрыть
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Название задачи"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  required
                />

                <select
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  disabled={isOpenForSelfAssign}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Без исполнителя</option>

                  {members.map((member) => (
                    <option key={member.id} value={member.user}>
                      {member.user_name || 'Пользователь'}
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание задачи"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Дата начала
                  </label>

                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Дедлайн
                  </label>

                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={isOpenForSelfAssign}
                  onChange={(e) => setIsOpenForSelfAssign(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />

                Можно взять самостоятельно
              </label>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskForm(false)
                    setEditingTask(null)
                  }}
                  className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Отменить
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
                >
                  {editingTask ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onClick={() => onOpenTask(task)}
              canManageTasks={canManageTasks}
              onEdit={() => startEditTask(task)}
              onDelete={() => setTaskToDelete(task)}
            />
          ))
        ) : (
          <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
            Задач пока нет.
          </div>
        )}
      </div>

      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-xl font-bold">Удалить задачу?</h3>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Задача «{taskToDelete.title}» будет удалена без возможности восстановления.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleDeleteTask}
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Да, удалить
              </button>

              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function TaskRow({ task, onClick, canManageTasks, onEdit, onDelete }) {
  const statusText = task.status_display || task.status || "Без статуса"

  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString("ru-RU")
    : "не указан"

  const startDate = task.start_date
    ? new Date(task.start_date).toLocaleDateString("ru-RU")
    : "не указано"

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-violet-300 hover:bg-violet-50/30 dark:border-slate-800 dark:hover:border-violet-800 dark:hover:bg-violet-950/20 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <div className="font-semibold">{task.title}</div>

        <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span>{task.assignee_name || "Без исполнителя"}</span>
          <span>Начало: {startDate}</span>
          <span>Дедлайн: {deadline}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${statusClass(statusText)}`}>
          {statusText}
        </span>

        {canManageTasks && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-slate-800"
              title="Редактировать"
            >
              <Pencil size={16} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
              title="Удалить"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function FilesView({ project, folders = [], setFolders, projectFiles = [], setProjectFiles }) {
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [description, setDescription] = useState('')
  const [folderName, setFolderName] = useState('')
  const [folderError, setFolderError] = useState('')
  const [editingFolderId, setEditingFolderId] = useState(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [editingFileId, setEditingFileId] = useState(null)
  const [editingFileName, setEditingFileName] = useState('')
  const [movingFileId, setMovingFileId] = useState(null)
  const [folderToDelete, setFolderToDelete] = useState(null)
  const [projectFileToDelete, setProjectFileToDelete] = useState(null)
  const fileInputRef = React.useRef(null)

  const visibleFiles =
    selectedFolderId === null
      ? projectFiles
      : projectFiles.filter(
          (file) => Number(file.folder) === Number(selectedFolderId)
        )

  

  async function handleCreateFolder(e) {
    e.preventDefault()

    if (!folderName.trim()) {
      setFolderError('Введите название папки')
      return
    }

    setFolderError('')

    const created = await createProjectFolder({
      project: project.id,
      name: folderName.trim(),
      parent: selectedFolderId,
    })

    setFolders((prev) => [...prev, created])
    setFolderName('')
  }

  async function handleRenameFolder(folder) {
    if (!editingFolderName.trim()) return

    const updated = await updateProjectFolder(folder.id, {
      name: editingFolderName,
    })

    setFolders((prev) =>
      prev.map((item) =>
        item.id === folder.id ? updated : item
      )
    )

    setEditingFolderId(null)
    setEditingFolderName('')
  }

  async function handleDeleteFolder() {
    if (!folderToDelete) return

    await deleteProjectFolder(folderToDelete.id)

    setFolders((prev) =>
      prev.filter((item) => Number(item.id) !== Number(folderToDelete.id))
    )

    setProjectFiles((prev) =>
      prev.filter((file) => Number(file.folder) !== Number(folderToDelete.id))
    )

    if (Number(selectedFolderId) === Number(folderToDelete.id)) {
      setSelectedFolderId(null)
    }

    setFolderToDelete(null)
  }

  async function handleRenameFile(fileItem) {
    if (!editingFileName.trim()) return

    const updated = await updateProjectFile(fileItem.id, {
      display_name: editingFileName.trim(),
    })

    setProjectFiles((prev) =>
      prev.map((item) =>
        item.id === fileItem.id ? updated : item
      )
    )

    setEditingFileId(null)
    setEditingFileName('')
  }

  async function handleUpload(e) {
    e.preventDefault()

    if (!file) {
      setFileError('Выберите файл для загрузки')
      return
    }

    const formData = new FormData()
    formData.append('project', project.id)
    formData.append('file', file)
    formData.append('description', description)

    if (selectedFolderId) {
      formData.append('folder', selectedFolderId)
    }

    const created = await createProjectFile(formData)

    setProjectFiles((prev) => [created, ...prev])
    setFile(null)
    setDescription('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

  }

  async function handleDeleteProjectFile() {
    if (!projectFileToDelete) return

    await deleteProjectFile(projectFileToDelete.id)

    setProjectFiles((prev) =>
      prev.filter((item) => item.id !== projectFileToDelete.id)
    )

    setProjectFileToDelete(null)
  }

  async function handleMoveFile(fileId, folderId) {
    const updated = await updateProjectFile(fileId, {
      folder: folderId || null,
    })

    setProjectFiles((prev) =>
      prev.map((item) =>
        item.id === fileId ? updated : item
      )
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="p-5">
        <div className="mb-4">
          <h2 className="font-bold">Папки</h2>

          <form onSubmit={handleCreateFolder} className="mt-4 flex gap-2">
            <input
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value)

                if (e.target.value.trim()) {
                  setFolderError('')
                }
              }}
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Название папки"
            />

            <button
              type="submit"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold text-white hover:bg-violet-700"
            >
              +
            </button>
          </form>

          {folderError && (
            <div className="mt-2 text-sm text-red-500">
              {folderError}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm ${
              selectedFolderId === null
                ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Folder size={18} className="text-violet-500" />
            Все файлы
          </button>

          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`rounded-2xl px-3 py-3 ${
                selectedFolderId === folder.id
                  ? 'bg-violet-50 dark:bg-violet-950/40'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedFolderId(folder.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left text-sm"
                >
                  <Folder size={18} className="shrink-0 text-violet-500" />

                  {editingFolderId === folder.id ? (
                    <input
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                    />
                  ) : (
                    <span className="truncate">
                      {folder.name}
                    </span>
                  )}
                </button>

                <div className="flex items-center gap-1">
                {editingFolderId === folder.id ? (
                  <button
                    onClick={() => handleRenameFolder(folder)}
                    className="text-xs font-semibold text-emerald-600"
                  >
                    OK
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingFolderId(folder.id)
                      setEditingFolderName(folder.name)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-slate-800"
                    title="Переименовать"
                  >
                    <Pencil size={16} />
                  </button>
                )}

                <button
                  onClick={() => setFolderToDelete(folder)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                  title="Удалить"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h2 className="font-bold">Файлы проекта</h2>
        </div>

        <form
          onSubmit={handleUpload}
          className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Описание файла"
            />

           <label className="flex h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-600 dark:border-slate-700 dark:bg-slate-800">
              Выбрать файл
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  setFile(e.target.files[0])
                  setFileError('')
                }}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              className="h-12 rounded-2xl bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Загрузить
            </button>
          </div>

          <div className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            {file
              ? `Выбран файл: ${file.name}`
              : `Файл будет загружен ${
                  selectedFolderId ? 'в выбранную папку.' : 'в корень проекта.'
                }`
            }
          </div>

          {fileError && (
            <div className="mt-2 text-sm text-red-500">
              {fileError}
            </div>
          )}
        </form>

        <div className="space-y-3">
          {visibleFiles.length > 0 ? (
            visibleFiles.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="min-w-0">
                  {editingFileId === item.id ? (
                    <div className="flex gap-2">
                      <input
                        value={editingFileName}
                        onChange={(e) => setEditingFileName(e.target.value)}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                      />

                      <button
                        type="button"
                        onClick={() => handleRenameFile(item)}
                        className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <a
                        href={item.file}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
                      >
                        {item.display_name || getFileName(item.file)}
                      </a>
                    </div>
                  )}

                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {item.description || 'Без описания'}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    Папка: {item.folder_name || 'Корень проекта'}
                  </div>
                </div>

                <div className="relative flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFileId(item.id)
                      setEditingFileName(item.display_name || getFileName(item.file))
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-slate-800"
                    title="Переименовать"
                  >
                  <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMovingFileId(movingFileId === item.id ? null : item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-violet-600 dark:hover:bg-slate-800"
                    title="Перенести"
                  >
                    📁
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectFileToDelete(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    title="Удалить"
                  >
                    <Trash2 size={16} />
                  </button>

                  {movingFileId === item.id && (
                    <div className="absolute right-0 top-10 z-10 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => {
                          handleMoveFile(item.id, null)
                          setMovingFileId(null)
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Корень проекта
                      </button>

                      {folders.map((folder) => (
                        <button
                          key={folder.id}
                          type="button"
                          onClick={() => {
                            handleMoveFile(item.id, folder.id)
                            setMovingFileId(null)
                          }}
                          className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {folder.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
              Файлов пока нет.
            </div>
          )}
        </div>
      </Card>
      {folderToDelete && (
        <ConfirmModal
          title="Удалить папку?"
          text={`Папка «${folderToDelete.name || 'папка'}» будет удалена вместе с файлами внутри.`}
          confirmText="Да, удалить"
          danger
          onConfirm={handleDeleteFolder}
          onCancel={() => setFolderToDelete(null)}
                />
        )}

      {projectFileToDelete && (
        <ConfirmModal
          title="Удалить файл?"
          text={`Файл «${projectFileToDelete.display_name || getFileName(projectFileToDelete.file)}» будет удалён.`}
          confirmText="Да, удалить"
          danger
          onConfirm={handleDeleteProjectFile}
          onCancel={() => setProjectFileToDelete(null)}
        />
      )}
    </div>
  )
}

function Meetings({ project, meetings = [], setMeetings }) {
  const [title, setTitle] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [meetingError, setMeetingError] = useState('')
  const [meetingToDelete, setMeetingToDelete] = useState(null)

  async function handleCreateMeeting(e) {
    e.preventDefault()

    if (!title.trim() || !meetingUrl.trim() || !scheduledAt) {
      setMeetingError('Заполните название, ссылку и дату созвона')
      return
    }

    const created = await createMeeting({
      project: project.id,
      title,
      meeting_url: meetingUrl,
      scheduled_at: scheduledAt,
    })

    setMeetings((prev) => [...prev, created])

    setTitle('')
    setMeetingUrl('')
    setScheduledAt('')
    setMeetingError('')
  }

  async function handleDeleteMeeting() {
    if (!meetingToDelete) return

    await deleteMeeting(meetingToDelete.id)

    setMeetings((prev) =>
      prev.filter((item) => item.id !== meetingToDelete.id)
    )

    setMeetingToDelete(null)
  }
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">Созвоны проекта</h2>
      </div>

      <form onSubmit={handleCreateMeeting} className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setMeetingError('')
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Название созвона"
          />

          <input
            value={meetingUrl}
            onChange={(e) => { 
              setMeetingUrl(e.target.value)
              setMeetingError('')
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Ссылка на созвон"
          />

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => {
              setScheduledAt(e.target.value)
              setMeetingError('')
            }}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <button
          type="submit"
          className="mt-4 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Добавить созвон
        </button>

        {meetingError && (
          <div className="mt-3 text-sm text-red-500">
            {meetingError}
          </div>
        )}

      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {meetings.length > 0 ? (
          meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-violet-50 p-3 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                    <Video size={20} />
                  </div>

                  <div>
                    <div className="font-bold">{meeting.title}</div>

                    <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {meeting.scheduled_at
                        ? new Date(meeting.scheduled_at).toLocaleString("ru-RU")
                        : "Дата не указана"}
                    </div>

                    <a
                      href={meeting.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Перейти
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMeetingToDelete(meeting)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
            Созвонов пока нет.
          </div>
        )}
      </div>

        {meetingToDelete && (
          <ConfirmModal
            title="Удалить созвон?"
            text={`Созвон «${meetingToDelete.title}» будет удалён.`}
            confirmText="Да, удалить"
            danger
            onConfirm={handleDeleteMeeting}
            onCancel={() => setMeetingToDelete(null)}
          />
        )}

    </Card>
  )
}

function Gantt({ tasks = [] }) {
  const ganttRef = React.useRef(null)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  function formatDate(date) {
    if (!date) return 'не указано'
    return new Date(date).toLocaleDateString('ru-RU')
  }

  function getEndDate(task) {
    return task.last_submission_at || task.deadline
  }

  function isTaskVisible(task) {
    const taskStart = task.start_date ? new Date(task.start_date) : null
    const taskEnd = getEndDate(task) ? new Date(getEndDate(task)) : null

    const from = dateFrom ? new Date(dateFrom) : null
    const to = dateTo ? new Date(dateTo) : null

    if (!from && !to) return true

    if (from && taskEnd && taskEnd < from) return false
    if (to && taskStart && taskStart > to) return false

    return true
  }

  function resetFilters() {
    setDateFrom('')
    setDateTo('')
  }

  const visibleTasks = tasks.filter(isTaskVisible)

  async function downloadGantt() {
    if (!ganttRef.current) return

    const canvas = await html2canvas(ganttRef.current)
    const link = document.createElement('a')

    link.download = 'gantt-diagram.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <h2 className="text-xl font-bold">Гант-диаграмма</h2>

        <button
          type="button"
          onClick={downloadGantt}
          className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Скачать PNG
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="mb-3 font-semibold">Период отображения</div>

        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
          />

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Сброс
          </button>
        </div>
      </div>

      <div ref={ganttRef} className="space-y-5 bg-white p-4 dark:bg-slate-900">
        {visibleTasks.length > 0 ? (
          visibleTasks.map((task, index) => (
            <div key={task.id} className="grid gap-3 md:grid-cols-[260px_1fr] md:items-center">
              <div>
                <div className="font-semibold">{task.title}</div>

                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(task.start_date || task.start)} — {formatDate(getEndDate(task))}
                </div>
              </div>

              <div className="h-9 rounded-full bg-slate-100 p-1 dark:bg-slate-800">
                <div
                  className="h-7 rounded-full bg-violet-500"
                  style={{
                    width: `${Math.max(10, Math.min(100 - index * 6, 45 + index * 18))}%`,
                    marginLeft: `${index * 6}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
            Нет задач за выбранный период.
          </div>
        )}
      </div>
    </Card>
  )
}

function Members({ members = [], supervisor }) {

  const [memberSearch, setMemberSearch] = useState('')

  const allMembers = [
    {
      id: 'supervisor',
      user_name: supervisor || 'Руководитель не указан',
      role: 'Руководитель проекта',
      user_role_display: 'Преподаватель',
    },
    ...members,
  ]

  const visibleMembers = allMembers.filter((member) => {
    const query = memberSearch.toLowerCase().trim()

    if (!query) return true

    return (
      (member.user_name || '').toLowerCase().includes(query) ||
      (member.role || '').toLowerCase().includes(query) ||
      (member.user_group_number || '').toLowerCase().includes(query) ||
      (member.user_role_display || '').toLowerCase().includes(query)
    )
  })

  return (
    <Card className="p-6">
      <h2 className="mb-5 text-xl font-bold">Участники проекта</h2>

      <div className="mt-5 mb-4">
        <input
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Поиск по ФИО, роли или группе"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        {visibleMembers.length > 0 ? (
          visibleMembers.map((member) => (
            <div
              key={member.id}
              className="grid gap-2 border-b border-slate-200 p-4 last:border-b-0 dark:border-slate-800 md:grid-cols-3"
            >
              <div>
                <div className="font-semibold">
                  {member.user_name || 'Пользователь'}
                </div>

                {member.user_role === 'student' && (
                  <div className="text-xs text-slate-400">
                    Группа: {member.user_group_number || 'не указана'}
                  </div>
                )}
              </div>

              <div className="text-slate-500 dark:text-slate-400">
                {member.role || 'Роль не указана'}
              </div>

              <div className="text-slate-500 dark:text-slate-400">
                {member.user_role_display || member.user_role || ''}
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
            Участники пока не добавлены.
          </div>
        )}
      </div>
    </Card>
  )
}

function Reports({ project }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="p-6">
        <Download className="mb-4 text-violet-500" size={28} />
        <h2 className="text-xl font-bold">Excel-отчёт</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Таблица задач, статусов, участников и сроков проекта.
        </p>

        <button
          onClick={() => downloadProjectReport(project.id, 'excel')}
          className="mt-5 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Скачать Excel
        </button>
      </Card>

      <Card className="p-6">
        <Download className="mb-4 text-violet-500" size={28} />
        <h2 className="text-xl font-bold">PDF-отчёт</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Готовый отчёт по проекту для просмотра и печати.
        </p>

        <button
          onClick={() => downloadProjectReport(project.id, 'pdf')}
          className="mt-5 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Скачать PDF
        </button>
      </Card>

      <Card className="p-6">
        <Download className="mb-4 text-violet-500" size={28} />
        <h2 className="text-xl font-bold">Шаблон паспорта проекта</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          Excel-шаблон для заполнения паспорта проекта.
        </p>

        <button
          onClick={() => downloadProjectPassportTemplate(project.id)}
          className="mt-5 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
        >
          Скачать шаблон
        </button>
      </Card>
    </div>
  )
}

function PasswordRecoveryModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      await requestPasswordReset(email)

      setSuccess(true)
    } catch (error) {
      setError('Не удалось отправить письмо')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h3 className="text-xl font-bold">
          Восстановление доступа
        </h3>

        {success ? (
          <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            Письмо отправлено на вашу почту.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Почта"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            />

            {error && (
              <div className="text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Отправить
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Закрыть
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function LoginScreen({ onLogin, onSwitchToRegister }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [recoveryOpen, setRecoveryOpen] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    setLoading(true)
    setError('')

    try {
      await login(username, password)

      const user = await getMe()

      onLogin(user)
    } catch (err) {
      setError('Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] p-6 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Project Manager</h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Система управления учебными проектами
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Логин
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Введите логин"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Пароль
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder="Пароль"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <button
            type="button"
            onClick={onSwitchToRegister}
            className="w-full text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            Зарегистрироваться
          </button>

          <button
            type="button"
            onClick={() => setRecoveryOpen(true)}
            className="w-full text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            Проблемы со входом?
          </button>
        </form>
      </div>

      {recoveryOpen && (
        <PasswordRecoveryModal
          onClose={() => setRecoveryOpen(false)}
        />
      )}

    </div>
  )
}

function TaskDetails({
  task,
  user,
  setTask,
  setTasks,
  onBack,
  onEdit,
  onDelete,
  members = [],
}) {
  const [submissions, setSubmissions] = useState([])
  const [textAnswer, setTextAnswer] = useState('')
  const [link, setLink] = useState('')
  const [isEditingSubmission, setIsEditingSubmission] = useState(false)
  const [files, setFiles] = useState([])
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [editingComment, setEditingComment] = useState(null)
  const [teacherComment, setTeacherComment] = useState('')
  const [grade, setGrade] = useState('')
  const [taskMenuOpen, setTaskMenuOpen] = useState(false)
  const [taskEditOpen, setTaskEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title || '')
  const [editDescription, setEditDescription] = useState(task.description || '')
  const [editAssignee, setEditAssignee] = useState(task.assignee || '')
  const [editStartDate, setEditStartDate] = useState(task.start_date || '')
  const [submissionFileToDelete, setSubmissionFileToDelete] = useState(null)
  const [editDeadline, setEditDeadline] = useState(
    task.deadline ? task.deadline.slice(0, 16) : ''
  )
  const [editSelfAssign, setEditSelfAssign] = useState(task.is_open_for_self_assign || false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteSubmissionConfirmOpen, setDeleteSubmissionConfirmOpen] = useState(false)
  const [alertModal, setAlertModal] = useState(null)

  const mySubmission = submissions.find(
    (submission) => Number(submission.student) === Number(user?.id)
  )

  const latestSubmission = submissions.length > 0
  ? [...submissions].sort(
      (a, b) => new Date(b.submitted_at || b.created_at) - new Date(a.submitted_at || a.created_at)
    )[0]
  : null

  const canEditSubmission =
    user?.role === 'teacher' ||
    user?.role === 'admin' ||
    Number(task.assignee) === Number(user?.id)

  const editableSubmission =
    canEditSubmission ? latestSubmission : null

  const canSeeGrade =
    user?.role === 'teacher' ||
    user?.role === 'admin' ||
    task.assignee === user?.id

  const canTakeTask =
  user?.role === 'student' &&
  task.is_open_for_self_assign &&
  !task.assignee

  const canCancelSelfAssign =
    user?.role === 'student' &&
    Number(task.assignee) === Number(user?.id) &&
    task.self_assigned

  const currentMember = members.find(
    (member) => member.user === user.id
  )

  const canManageTasks =
    user?.role === 'admin' ||
    user?.role === 'teacher' ||
    currentMember?.role === 'Тимлид'

  const canShowTaskMenu = canManageTasks
  
  async function handleSaveTaskEdit(e) {
    e.preventDefault()

    const updated = await updateTask(task.id, {
      title: editTitle,
      description: editDescription,
      assignee: editSelfAssign ? null : editAssignee || null,
      start_date: editStartDate || null,
      deadline: editDeadline
        ? new Date(editDeadline).toISOString()
        : null,
      is_open_for_self_assign: editSelfAssign,
    })

    setTask(updated)

    if (setTasks) {
      setTasks((prev) =>
        prev.map((item) =>
          item.id === updated.id ? updated : item
        )
      )
    }

    setTaskEditOpen(false)
  }

  async function handleDeleteCurrentTask() {
    await deleteTask(task.id)

    if (setTasks) {
      setTasks((prev) => prev.filter((item) => item.id !== task.id))
    }

    setDeleteConfirmOpen(false)
    onBack()
  }

  useEffect(() => {
    getSubmissions(task.id)
      .then((data) => setSubmissions(data))
      .catch((error) => console.log('Ошибка загрузки сдач:', error))
  }, [task.id])

  useEffect(() => {
    getComments(task.id)
      .then((data) => setComments(data))
      .catch((error) => console.log('Ошибка загрузки комментариев:', error))
  }, [task.id])

  const statusText = task.status_display || taskStatusLabel(task.status)

  const deadline = task.deadline
    ? new Date(task.deadline).toLocaleDateString("ru-RU")
    : "не указан"

  const startDate = task.start_date
    ? new Date(task.start_date).toLocaleDateString("ru-RU")
    : "не указано"

  async function handleSubmit(e) {
    e.preventDefault()

    const formData = new FormData()
      formData.append('task', task.id)
      formData.append('text_answer', textAnswer)
      formData.append('link', link)

    const submission = isEditingSubmission && editableSubmission
      ? await updateSubmission(editableSubmission.id, formData)
      : await createSubmission(formData)

    for (const file of files) {
      const fileData = new FormData()
      fileData.append('submission', submission.id)
      fileData.append('file', file)

      await createSubmissionFile(fileData)
    }

    const updatedSubmissions = await getSubmissions(task.id)
    setSubmissions(updatedSubmissions)

    setTextAnswer('')
    setLink('')
    setFiles([])
    setIsEditingSubmission(false)
  }

  async function handleCreateComment(e) {
    e.preventDefault()

    if (!commentText.trim()) return

    if (editingComment) {
      await updateComment(editingComment.id, commentText)

      const updated = await getComments(task.id)
      setComments(updated)

      setEditingComment(null)
      setCommentText('')
      return
    }

    await createComment(task.id, commentText, replyTo?.id || null)

    const updated = await getComments(task.id)
    setComments(updated)

    setReplyTo(null)
    setCommentText('')
  }

  async function handleDeleteComment(commentId) {
    await deleteComment(commentId)

    const updated = await getComments(task.id)
    setComments(updated)
  }

  function startReply(comment) {
    setReplyTo(comment)
    setEditingComment(null)
    setCommentText('')
  }

  function startEditComment(comment) {
    setEditingComment(comment)
    setReplyTo(null)
    setCommentText(comment.text)
  }

  function cancelCommentAction() {
    setReplyTo(null)
    setEditingComment(null)
    setCommentText('')
  }

  function startEditSubmission() {
    if (!editableSubmission) return

    setTextAnswer(editableSubmission.text_answer || '')
    setLink(editableSubmission.link || '')
    setFiles([])
    setIsEditingSubmission(true)
  }

 async function handleDeleteSubmission() {
    if (!mySubmission) return

    await deleteSubmission(mySubmission.id)

    setSubmissions([])
    setTextAnswer('')
    setLink('')
    setFiles([])
    setIsEditingSubmission(false)

    onBack()
  }

  async function handleReviewSubmission(reviewStatus) {
    if (!editableSubmission) return

    try {
      const updated = await reviewSubmission(editableSubmission.id, {
        review_status: reviewStatus,
        teacher_comment: teacherComment,
        grade: grade || null,
      })

      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === updated.id ? updated : item
        )
      )

      setTeacherComment('')
      setGrade('')

      const newStatus =
        reviewStatus === 'accepted' ? 'accepted' : 'rejected'

      const newStatusDisplay =
        reviewStatus === 'accepted' ? 'Принято' : 'Отклонено'

      if (setTask) {
      setTask((prev) => ({
        ...prev,
        status: newStatus,
        status_display: newStatusDisplay,
      }))
    }
      if (setTasks) {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === task.id
              ? {
                  ...item,
                  status: newStatus,
                  status_display: newStatusDisplay,
                }
              : item
          )
        )
      }
    } catch (error) {
      console.log('Ошибка проверки ответа:', error.response?.data || error)
      showAppAlert('Не удалось сохранить проверку ответа', 'error')
    }
  }

  function cancelEditSubmission() {
    setTextAnswer('')
    setLink('')
    setFiles([])
    setIsEditingSubmission(false)
  }

  async function handleDeleteFile() {
    if (!submissionFileToDelete) return

    await deleteSubmissionFile(submissionFileToDelete.id)

    const updatedSubmissions = await getSubmissions(task.id)
    setSubmissions(updatedSubmissions)

    setSubmissionFileToDelete(null)
  }

  async function handleSelfAssignCurrentTask() {
    try {
      const updated = await selfAssignTask(task.id)

      setTask(updated)

      if (setTasks) {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === updated.id ? updated : item
          )
        )
      }
    } catch (error) {
      console.log('Ошибка принятия задачи:', error.response?.data || error)
      showAppAlert(error.response?.data?.detail || 'Не удалось принять задачу', 'error')
    }
  }

  async function handleCancelSelfAssignCurrentTask() {
    try {
      const updated = await cancelSelfAssignTask(task.id)

      setTask(updated)

      if (setTasks) {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === updated.id ? updated : item
          )
        )
      }
    } catch (error) {
      console.log('Ошибка отказа от задачи:', error.response?.data || error)
      showAppAlert(error.response?.data?.detail || 'Не удалось отказаться от задачи', 'error')
    }
  }

  async function handleArchiveProject() {
    try {
      await updateProject(project.id, {
        status: 'completed',
      })

      setArchiveProjectConfirmOpen(false)
      showAppAlert('Проект отправлен в архив', 'success')
    } catch (error) {
      console.log('Ошибка архивации проекта:', error.response?.data || error)
      showAppAlert('Не удалось отправить проект в архив', 'error')
    }
  }

  async function handleDeleteProject() {
    try {
      await deleteProject(project.id)

      setDeleteProjectConfirmOpen(false)
      window.location.reload()
    } catch (error) {
      console.log('Ошибка удаления проекта:', error.response?.data || error)
      showAppAlert('Не удалось удалить проект', 'error')
    }
  }

  const hasSubmissionContent =
    Boolean(latestSubmission?.text_answer) ||
    Boolean(latestSubmission?.link) ||
    Boolean(latestSubmission?.files?.length)

  return (
    <Card className="p-6">
  <div className="mb-5 flex items-center justify-between">
    <button
      onClick={onBack}
      className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-300"
    >
      ← Назад к задачам
    </button>

    <div className="flex items-center gap-3">
      {canTakeTask && (
        <button
          type="button"
          onClick={() => {
            handleSelfAssignCurrentTask()
          }}
          className="rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Принять задачу
        </button>
      )}

      {canCancelSelfAssign && (
        <button
          type="button"
          onClick={() => {
            handleCancelSelfAssignCurrentTask()
          }}
          className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
        >
          Отказаться
        </button>
      )}

      {canShowTaskMenu && (
      <div className="relative">
        <button
          type="button"
          onClick={() => setTaskMenuOpen((prev) => !prev)}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <MoreVertical size={18} />
        </button>

        {taskMenuOpen && (
          <div className="absolute right-0 z-30 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
            {canManageTasks && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setTaskMenuOpen(false)
                    setTaskEditOpen(true)
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Изменить задачу
                </button>

                <button
                  type="button"
                  onClick={() => setSubmissionFileToDelete(file)}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  Удалить задачу
                </button>
              </>
            )}
          </div>
        )}
      </div>
    )}
    </div>
  </div>

  <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-2xl font-bold">{task.title}</h2>

          <p className="mt-3 max-w-3xl text-slate-500 dark:text-slate-400">
            {task.description || "Описание задачи не указано."}
          </p>
        </div>

        <div className="flex items-start gap-2">
          <span className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${statusClass(statusText)}`}>
            {statusText}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
          <div className="text-sm text-slate-500 dark:text-slate-400">Исполнитель</div>
          <div className="mt-1 font-semibold">{task.assignee_name || "Без исполнителя"}</div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
          <div className="text-sm text-slate-500 dark:text-slate-400">Дата начала</div>
          <div className="mt-1 font-semibold">{startDate}</div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
          <div className="text-sm text-slate-500 dark:text-slate-400">Дедлайн</div>
          <div className="mt-1 font-semibold">{deadline}</div>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <h3 className="font-bold">Ответ</h3>

            {isEditingSubmission && canEditSubmission ? (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Введите комментарий к выполненной работе"
                />

                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Ссылка на результат"
                />

                <div>
                  <label className="mb-2 block text-sm font-medium">Файлы ответа</label>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer rounded-2xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300">
                      Выберите файлы

                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => setFiles(Array.from(e.target.files))}
                      />
                    </label>

                    {files.length > 0 ? (
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Выбрано файлов: {files.length}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Файлы не выбраны
                      </span>
                    )}
                  </div>

                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file) => (
                        <div
                          key={file.name}
                          className="rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/70"
                        >
                          {file.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {editableSubmission?.files?.length > 0 && (
                    <div className="mt-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                      <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                        Уже загруженные файлы
                      </div>

                      <div className="space-y-2">
                        {editableSubmission.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 dark:bg-slate-900"
                          >
                            <a
                              href={file.file_url || file.file}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-300"
                              title={file.file_name || file.name || file.file_url || file.file}
                            >
                              {file.file_name || file.name || (file.file_url || file.file || '').split('/').pop()}
                            </a>

                            <button
                              type="button"
                              onClick={() => setFileToDelete(file)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Сохранить изменения
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditSubmission}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Отменить
                  </button>
                </div>
              </form>
            ) : latestSubmission && hasSubmissionContent ? (
              <div className="mt-4 space-y-4">
                {latestSubmission.text_answer && (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800/70">
                    {latestSubmission.text_answer}
                  </div>
                )}

                {latestSubmission.link && (
                  <a
                    href={latestSubmission.link}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-300"
                  >
                    Открыть ссылку на результат
                  </a>
                )}

                {latestSubmission.files?.length > 0 && (
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                    <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                      Файлы ответа
                    </div>

                    <div className="space-y-2">
                      {latestSubmission.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 dark:bg-slate-900"
                        >
                          <a
                            href={file.file_url || file.file}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-300"
                            title={file.file_name || file.name || file.file_url || file.file}
                          >
                            {file.file_name || file.name || (file.file_url || file.file || '').split('/').pop()}
                          </a>

                          {canEditSubmission && Number(latestSubmission.student) === Number(user?.id) && (
                            <button
                              type="button"
                              onClick={() => setFileToDelete(file)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canEditSubmission && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={startEditSubmission}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Изменить ответ
                    </button>

                    <button
                      onClick={() => setDeleteSubmissionConfirmOpen(true)}
                      className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                    >
                      Удалить ответ
                    </button>
                  </div>
                )}
              </div>

                ) : latestSubmission && canEditSubmission ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                      Файлы ответа удалены. Можно изменить ответ или удалить его полностью.
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={startEditSubmission}
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        Изменить ответ
                      </button>

                      <button
                        onClick={() => setDeleteSubmissionConfirmOpen(true)}
                        className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                      >
                        Удалить ответ
                      </button>
                    </div>
                  </div>

            ) : canEditSubmission ? (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Введите комментарий к выполненной работе"
                />

                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Ссылка на результат"
                />

                <div>
                  <label className="mb-2 block text-sm font-medium">Файлы ответа</label>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer rounded-2xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300">
                      Выберите файлы

                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => setFiles(Array.from(e.target.files))}
                      />
                    </label>

                    {files.length > 0 ? (
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Выбрано файлов: {files.length}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">
                        Файлы не выбраны
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Отправить на проверку
                </button>
              </form>
            ) : (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                Ответ исполнителя пока не загружен.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <h3 className="font-bold">Комментарии</h3>

            <div className="mt-4 space-y-3">
              {comments.length > 0 ? (
                comments
                  .filter((comment) => !comment.parent)
                  .map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      onReply={startReply}
                      onEdit={startEditComment}
                      onDelete={handleDeleteComment}
                      user={user}
                    />
                  ))
              ) : (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Комментариев пока нет.
                </div>
              )}
            </div>

            {(replyTo || editingComment) && (
              <div className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                {editingComment ? (
                  <>Редактирование комментария</>
                ) : (
                  <>Ответ на комментарий: {replyTo?.author_name || 'Пользователь'}</>
                )}

                <button
                  type="button"
                  onClick={cancelCommentAction}
                  className="ml-3 font-semibold underline"
                >
                  отменить
                </button>
              </div>
            )}

            <form onSubmit={handleCreateComment} className="mt-4 space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder={
                  editingComment
                    ? "Изменить комментарий"
                    : replyTo
                      ? "Написать ответ"
                      : "Написать комментарий"
                }
              />

              <button
                type="submit"
                className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                {editingComment ? 'Сохранить комментарий' : replyTo ? 'Отправить ответ' : 'Отправить комментарий'}
              </button>
            </form>
          </div>
        </div>

        {latestSubmission && (latestSubmission.teacher_comment || (canSeeGrade && latestSubmission.grade)) && (
          <div className="rounded-2xl border border-slate-200 bg-sky-50/40 p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h3 className="font-bold">Результат проверки</h3>

              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Ответ проверен преподавателем
              </div>
            </div>

            <div className="space-y-4">
              {latestSubmission.teacher_comment && (
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Комментарий преподавателя
                  </div>

                  <div className="rounded-2xl bg-white/80 p-4 text-sm dark:bg-slate-800">
                    {latestSubmission.teacher_comment}
                  </div>
                </div>
              )}

              {canSeeGrade && latestSubmission.grade && (
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Оценка
                  </div>

                  <div className="inline-flex rounded-2xl bg-white/80 px-4 py-2 text-lg font-bold dark:bg-slate-800">
                    {latestSubmission.grade}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(user?.role === 'teacher' || user?.role === 'admin') && latestSubmission && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h3 className="text-lg font-bold">Проверка ответа</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Оставьте комментарий, оценку и выберите результат проверки.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Оценка
                </label>

                <input
                  type="number"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Например: 5"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Комментарий преподавателя
                </label>

                <textarea
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Напишите комментарий к ответу студента"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleReviewSubmission('accepted')}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Принять ответ
                </button>

                <button
                  type="button"
                  onClick={() => handleReviewSubmission('rejected')}
                  className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Отклонить ответ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

        {taskEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Изменить задачу</h3>

              <button
                type="button"
                onClick={() => setTaskEditOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Закрыть
              </button>
            </div>

            <form onSubmit={handleSaveTaskEdit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Название задачи"
                />

                <select
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  disabled={editSelfAssign}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Без исполнителя</option>
                  {members.map((member) => (
                    <option key={member.user} value={member.user}>
                      {member.user_name}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                />

                <input
                  type="datetime-local"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder="Описание задачи"
              />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editSelfAssign}
                  onChange={(e) => setEditSelfAssign(e.target.checked)}
                />
                Задачу можно взять самостоятельно
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Сохранить изменения
                </button>

                <button
                  type="button"
                  onClick={() => setTaskEditOpen(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Отменить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-xl font-bold">Удалить задачу?</h3>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Задача «{task.title}» будет удалена без возможности восстановления.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleDeleteCurrentTask}
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Да, удалить
              </button>

              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {submissionFileToDelete && (
        <ConfirmModal
          title="Удалить файл?"
          text="Файл будет удалён из ответа на задание."
          confirmText="Да, удалить"
          danger
          onConfirm={handleDeleteFile}
          onCancel={() => setSubmissionFileToDelete(null)}
        />
      )}

      {deleteSubmissionConfirmOpen && (
        <ConfirmModal
          title="Удалить ответ на задание?"
          text="Ответ и прикреплённые файлы будут удалены без возможности восстановления."
          confirmText="Да, удалить"
          cancelText="Отмена"
          danger
          onConfirm={async () => {
            setDeleteSubmissionConfirmOpen(false)
            await handleDeleteSubmission()
          }}
          onCancel={() => setDeleteSubmissionConfirmOpen(false)}
        />
      )}

    </Card>
  )
}

function CommentItem({ comment, onReply, onEdit, onDelete, user }) {

    console.log(comment)

  const canManageComment =
    Number(comment.author_id) === Number(user?.id) ||
    Number(comment.user) === Number(user?.id) ||
    Number(comment.author) === Number(user?.id) ||
    user?.role === 'admin' ||
    user?.role === 'teacher'

  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
      <div className="mb-1 text-sm font-semibold">
        {comment.author_name || 'Пользователь'}
      </div>

      <div className="text-sm text-slate-600 dark:text-slate-300">
        {comment.text}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <button
          type="button"
          onClick={() => onReply(comment)}
          className="font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
        >
          Ответить
        </button>

        {canManageComment && (
          <>
            <button
              type="button"
              onClick={() => onEdit(comment)}
              className="font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
            >
              Изменить
            </button>

            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="font-semibold text-red-500 hover:text-red-600"
            >
              Удалить
            </button>
          </>
        )}
      </div>

      {comment.replies?.length > 0 && (
        <div className="mt-4 space-y-3 border-l-2 border-violet-100 pl-4 dark:border-violet-900">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              user={user}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function getTaskEndDate(task) {
  if (task.submitted_at) {
    return task.submitted_at
  }

  if (task.status === 'overdue') {
    return new Date().toISOString()
  }

  return task.deadline
}


function RegisterScreen({ onRegisterSuccess, onSwitchToLogin }) {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [groupNumber, setGroupNumber] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    setLoading(true)
    setError('')

    try {
      await register({
        username,
        email,
        full_name: fullName,
        group_number: groupNumber,
        password,
        
      })

      onRegisterSuccess()
    } catch (err) {
      setError('Не удалось зарегистрироваться. Проверьте данные.')
      if (password !== confirmPassword) {
        setError('Пароли не совпадают')
        setLoading(false)
        return
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] p-6 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Регистрация</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Создание аккаунта студента
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="ФИО"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Email"
          />

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Логин"
          />

          <input
            value={groupNumber}
            onChange={(e) => setGroupNumber(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Номер группы"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Пароль"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Повторите пароль"
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>

          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            Уже есть аккаунт? Войти
          </button>
        </form>
      </div>
    </div>
  )
}

function ProjectChat({ project, user }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const chatRef = React.useRef(null)

  useEffect(() => {
    getProjectChatMessages(project.id)
      .then((data) => setMessages(data))
      .catch((error) => console.log('Ошибка загрузки чата:', error))
  }, [project.id])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  async function handleSendMessage(e) {
    e.preventDefault()

    if (!text.trim()) return

    try {
      const created = await createProjectChatMessage(project.id, text.trim())

      setMessages((prev) => [...prev, created])
      setText('')
    } catch (error) {
      console.log('Ошибка отправки сообщения:', error.response?.data || error)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold">Чат проекта</h2>

      <div
  ref={chatRef}
  className="mt-5 h-[520px] space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
        {messages.length > 0 ? (
          messages.map((message) => {
            const isMine = message.author === user.id

            return (
              <div
                key={message.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[75%] rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                  <div className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                    {message.author_name || message.author_email || 'Пользователь'}
                  </div>

                  <div className="text-sm">
                    {message.text}
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    {new Date(message.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Сообщений пока нет.
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="mt-4 flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Написать сообщение"
        />

        <button
          type="submit"
          className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Отправить
        </button>
      </form>
    </Card>
  )
}

function ProfilePage({ user, projects = [], tasks = [], onUserUpdate, goBack }) {
  const [fullName, setFullName] = useState(user.full_name || '')
  const [email, setEmail] = useState(user.email || '')
  const [username, setUsername] = useState(user.username || '')
  const [saving, setSaving] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [groupNumber, setGroupNumber] = useState(user.group_number || '')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordRepeat, setNewPasswordRepeat] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [adminMetrics, setAdminMetrics] = useState(null)
  const [teacherTaskControl, setTeacherTaskControl] = useState(null)
  
  const [profileProjectId, setProfileProjectId] = useState(projects[0]?.id || '')
  const [profileTab, setProfileTab] = useState('tasks')
  const [profileTasks, setProfileTasks] = useState([])
  const [profileGrades, setProfileGrades] = useState([])

  const selectedProfileProject = projects.find(
    (project) => Number(project.id) === Number(profileProjectId)
  )

  const myTasks = profileTasks.filter(
    (task) => Number(task.assignee) === Number(user.id)
  )

  const myGrades = profileGrades.filter(
    (grade) => Number(grade.student) === Number(user.id)
  )

  const attestationGrades = myGrades.filter((grade) =>
    [
      'first_attestation',
      'second_attestation',
      'intermediate_attestation',
      'semester_total',
    ].includes(grade.grade_type)
  )

  const regularGrades = myGrades.filter(
    (grade) => grade.grade_type === 'regular'
  )

  const getGradeByType = (type) =>
    attestationGrades.find((grade) => grade.grade_type === type)

  useEffect(() => {
    if (user.role !== 'student' || !profileProjectId) return

    getTasks(profileProjectId)
      .then((data) => setProfileTasks(data))
      .catch((error) => console.log('Ошибка загрузки задач профиля:', error))

    getGrades(profileProjectId)
      .then((data) => setProfileGrades(data))
      .catch((error) => console.log('Ошибка загрузки оценок профиля:', error))
  }, [profileProjectId, user.id, user.role])

  async function handleSaveProfile(e) {
    e.preventDefault()

    setSaving(true)

    try {
      const updated = await updateMe({
        full_name: fullName,
        email,
        username,
        group_number: groupNumber,
      })

      onUserUpdate(updated)
      setIsEditingProfile(false)
    } finally {
      setSaving(false)
    }
  }
  async function handleChangePassword(e) {
    e.preventDefault()

    setPasswordMessage('')

    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_repeat: newPasswordRepeat,
      })

      setPasswordMessage('Пароль успешно изменён')
      setOldPassword('')
      setNewPassword('')
      setNewPasswordRepeat('')
      setIsChangingPassword(false)
    } catch (error) {
      setPasswordMessage(error.response?.data?.detail || 'Не удалось изменить пароль')
    }
  }

  function maskEmail(email) {
    if (!email) return ''

    const [name, domain] = email.split('@')

    if (!domain) return email

    const visiblePart = name.slice(0, 2)
    const maskedPart = '*'.repeat(Math.max(name.length - 2, 2))

    return `${visiblePart}${maskedPart}@${domain}`
  }

  function maskUsername(username) {
    if (!username) return ''

    if (username.length <= 2) {
      return username[0] + '*'
    }

    return (
      username.slice(0, 2) +
      '*'.repeat(username.length - 2)
    )
  }

  useEffect(() => {
    if (user.role !== 'admin') return

    getAdminMetrics()
      .then((data) => setAdminMetrics(data))
      .catch((error) => console.log('Ошибка загрузки метрик администратора:', error))
  }, [user.role])

  useEffect(() => {
    if (user.role !== 'teacher') return

    getTeacherTaskControl()
      .then((data) => setTeacherTaskControl(data))
      .catch((error) => console.log('Ошибка загрузки контроля задач:', error))
  }, [user.role])
  
  return (
  <div className="mx-auto max-w-5xl">
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Личный кабинет</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Данные пользователя и личная сводка
            </p>
          </div>

          <button onClick={goBack} className="mb-4 flex items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
            <ChevronRight className="rotate-180" size={18} /> К проектам
          </button>
        </div>

        <div className={`grid gap-5 ${user.role === 'student' ? 'md:grid-cols-2 md:items-stretch' : ''}`}>
            <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-bold">Профиль</h3>

                <div className="flex flex-wrap gap-2">
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Изменить данные
                  </button>
                )}

                {!isChangingPassword && (
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(true)}
                    className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Изменить пароль
                  </button>
                )}
              </div>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="mt-4 space-y-3">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="ФИО"
                  />

                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="Email"
                  />

                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="Логин"
                  />

                  {user.role === 'student' && (
                    <input
                      value={groupNumber}
                      onChange={(e) => setGroupNumber(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="Номер группы"
                    />
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {saving ? 'Сохранение...' : 'Сохранить'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      Отменить
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <div className="text-slate-500 dark:text-slate-400">ФИО</div>
                    <div className="font-semibold">{user.full_name || 'Не указано'}</div>
                  </div>

                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Логин</div>
                    <div className="font-semibold">{maskUsername(user.username) || 'Не указано' }</div>
                  </div>

                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Email</div>
                    <div className="font-semibold">{maskEmail(user.email) || 'Не указано'}</div>
                  </div>

                  {user.role === 'student' && (
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Группа</div>
                      <div className="font-semibold">{user.group_number || 'Не указана'}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-slate-500 dark:text-slate-400">Роль</div>
                    <div className="font-semibold">{roleLabel(user.role)}</div>
                  </div>
                </div>
              )}
            </div>

          
        {user.role === 'student' && (
          <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <h3 className="font-bold">Сводка</h3>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <div className="text-sm text-slate-500 dark:text-slate-400">Проекты</div>
                <div className="mt-1 text-2xl font-bold">{projects.length}</div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <div className="text-sm text-slate-500 dark:text-slate-400">Задачи выбранного проекта</div>
                <div className="mt-1 text-2xl font-bold">{myTasks.length}</div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {user.role === 'admin' && adminMetrics && (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-xl font-bold">Метрики системы</h3>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Пользователи
              </div>
              <div className="mt-2 text-3xl font-bold">
                {adminMetrics.users.total}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Проекты
              </div>
              <div className="mt-2 text-3xl font-bold">
                {adminMetrics.activity.projects}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Активные задачи
              </div>
              <div className="mt-2 text-3xl font-bold">
                {adminMetrics.activity.active_tasks}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Файлы
              </div>
              <div className="mt-2 text-3xl font-bold">
                {adminMetrics.activity.files}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
            <div className="mb-4 font-bold">Прогресс проектов</div>

            <div className="space-y-4">
              <AdminMetricBar
                label="Активные"
                value={adminMetrics.projects.active}
                total={adminMetrics.projects.total}
              />

              <AdminMetricBar
                label="Завершённые"
                value={adminMetrics.projects.completed}
                total={adminMetrics.projects.total}
              />

              <AdminMetricBar
                label="Архивные"
                value={adminMetrics.projects.archived}
                total={adminMetrics.projects.total}
              />
            </div>
          </div>
        </div>
      )}


       {user.role === 'teacher' && teacherTaskControl && (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-xl font-bold">Контроль задач</h3>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Проекты
              </div>
              <div className="mt-2 text-3xl font-bold">
                {teacherTaskControl.summary.projects}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Всего задач
              </div>
              <div className="mt-2 text-3xl font-bold">
                {teacherTaskControl.summary.total_tasks}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                В работе
              </div>
              <div className="mt-2 text-3xl font-bold">
                {teacherTaskControl.summary.in_progress}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/70">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Нужна проверка
              </div>
              <div className="mt-2 text-3xl font-bold">
                {teacherTaskControl.summary.review}
              </div>
            </div>

            <div className="rounded-2xl bg-red-50 p-5 dark:bg-red-950/30">
              <div className="text-sm text-red-500 dark:text-red-300">
                Просрочено
              </div>
              <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-300">
                {teacherTaskControl.summary.overdue}
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 p-5 dark:bg-amber-950/30">
              <div className="text-sm text-amber-600 dark:text-amber-300">
                Без исполнителя
              </div>
              <div className="mt-2 text-3xl font-bold text-amber-700 dark:text-amber-300">
                {teacherTaskControl.summary.without_assignee}
              </div>
            </div>
          </div>
        </div>
      )}

       {user.role === 'student' && (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h3 className="font-bold">
                {profileTab === 'tasks' ? 'Мои задачи' : 'Мои оценки'}
              </h3>

              {selectedProfileProject && (
                <select
                  value={profileProjectId}
                  onChange={(e) => setProfileProjectId(e.target.value)}
                  className="mt-2 w-full max-w-md rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setProfileTab('tasks')}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  profileTab === 'tasks'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-500 hover:text-violet-600'
                }`}
              >
                Мои задачи
              </button>

              <button
                type="button"
                onClick={() => setProfileTab('grades')}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  profileTab === 'grades'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-500 hover:text-violet-600'
                }`}
              >
                Мои оценки
              </button>
            </div>
          </div>

          {profileTab === 'tasks' ? (
            <div className="space-y-3">
              {myTasks.length > 0 ? (
                myTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div>
                      <div className="font-semibold">{task.title}</div>

                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {task.deadline
                          ? new Date(task.deadline).toLocaleDateString('ru-RU')
                          : 'Дедлайн не указан'}
                      </div>
                    </div>

                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass(task.status_display || task.status)}`}>
                      {task.status_display || taskStatusLabel(task.status)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                  В этом проекте у вас пока нет задач.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="mb-3 font-semibold">Аттестации</div>

                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    ['first_attestation', '1 атт.'],
                    ['second_attestation', '2 атт.'],
                    ['intermediate_attestation', 'Промеж.'],
                    ['semester_total', 'Семестр'],
                  ].map(([type, label]) => {
                    const grade = getGradeByType(type)

                    return (
                      <div
                        key={type}
                        className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-800/70"
                      >
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {label}
                        </div>

                        <div className="mt-2 text-2xl font-bold text-violet-600 dark:text-violet-300">
                          {grade ? grade.value : '—'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="mb-3 font-semibold">Обычные оценки</div>

                <div className="space-y-3">
                  {regularGrades.length > 0 ? (
                    regularGrades.map((grade) => (
                      <div
                        key={grade.id}
                        className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold">
                              {grade.reason || grade.task_title || 'Оценка'}
                            </div>

                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {grade.task_title
                                ? `Задача: ${grade.task_title}`
                                : 'Без привязки к задаче'}
                            </div>

                            {grade.comment && (
                              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                {grade.comment}
                              </div>
                            )}
                          </div>

                          <div className="rounded-2xl bg-violet-50 px-4 py-2 text-lg font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                            {grade.value}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                      Обычных оценок пока нет.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        {isChangingPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <h3 className="text-xl font-bold">Изменение пароля</h3>

              <form onSubmit={handleChangePassword} className="mt-5 space-y-3">
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Старый пароль"
                />

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Новый пароль"
                />

                <input
                  type="password"
                  value={newPasswordRepeat}
                  onChange={(e) => setNewPasswordRepeat(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Повторите новый пароль"
                />

                {passwordMessage && (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {passwordMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Сохранить пароль
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Отменить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
  )
}

function roleLabel(role) {
  switch (role) {
    case 'admin':
      return 'Администратор'

    case 'teacher':
      return 'Преподаватель'

    case 'student':
      return 'Студент'

    default:
      return role
  }
}

function TeacherPanel({
  project,
  members = [],
  setMembers,
  tasks = [],
  user,
  setActiveTab,
  setSelectedTask,
}) {
  const navigate = useNavigate()
  const location = useLocation()

  const [activeSection, setActiveSection] = useState('members')

  useEffect(() => {
    const sectionFromUrl =
      location.pathname.match(/\/teacher\/([^/]+)/)?.[1] || 'members'

    setActiveSection(sectionFromUrl)
  }, [location.pathname])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [editingMember, setEditingMember] = useState(null)

  const [editFullName, setEditFullName] = useState('')
  const [editGroup, setEditGroup] = useState('')
  const [editRole, setEditRole] = useState('')

  const [grades, setGrades] = useState([])
  const [gradeFormOpen, setGradeFormOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState(null)

  const [gradeStudent, setGradeStudent] = useState('')
  const [gradeTask, setGradeTask] = useState('')
  const [gradeReason, setGradeReason] = useState('')
  const [gradeValue, setGradeValue] = useState('')
  const [gradeComment, setGradeComment] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('spring')
  const [gradeStudentFilter, setGradeStudentFilter] = useState('')
  const [gradeDateFrom, setGradeDateFrom] = useState('')
  const [gradeDateTo, setGradeDateTo] = useState('')
  const [gradeToDelete, setGradeToDelete] = useState(null)
  const [gradeType, setGradeType] = useState('regular')
  const [gradeSemester, setGradeSemester] = useState('spring')

  const [projectTitle, setProjectTitle] = useState(project.title || '')
  const [projectDescription, setProjectDescription] = useState(project.description || '')
  const [projectDeadline, setProjectDeadline] = useState(project.end_date || '')
  const [savingProject, setSavingProject] = useState(false)

  const [deleteProjectConfirmOpen, setDeleteProjectConfirmOpen] = useState(false)
  const [archiveProjectConfirmOpen, setArchiveProjectConfirmOpen] = useState(false)
  const [completeProjectConfirmOpen, setCompleteProjectConfirmOpen] = useState(false)
  const [restoreProjectConfirmOpen, setRestoreProjectConfirmOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')

  const [attendanceList, setAttendanceList] = useState([])
  const [attendanceDate, setAttendanceDate] = useState('')
  const [attendanceError, setAttendanceError] = useState('')
  const [attendanceExtraDates, setAttendanceExtraDates] = useState([])
  const [memberToDelete, setMemberToDelete] = useState(null)
  const [attendanceDateToDelete, setAttendanceDateToDelete] = useState(null)
  const [alertModal, setAlertModal] = useState(null)

  const sections = [
    { id: 'members', label: 'Участники' },
    { id: 'reviews', label: 'Проверка ответов' },
    { id: 'grades', label: 'Оценивание' },
    { id: 'settings', label: 'Настройки проекта' },
    { id: 'attendance', label: 'Посещаемость' },
  ]

  const visibleMembers = members.filter((member) => {
    const query = memberSearch.toLowerCase().trim()

    if (!query) return true

    return (
      (member.user_name || '').toLowerCase().includes(query) ||
      (member.role || '').toLowerCase().includes(query) ||
      (member.user_group_number || '').toLowerCase().includes(query)
    )
  })

  async function handleInvite(e) {
    e.preventDefault()

    if (!inviteEmail.trim()) return

    try {
      const response = await inviteToProject(project.id, inviteEmail.trim(), inviteRole)
      const updatedMembers = await getProjectMembers(project.id)
      setMembers(updatedMembers)

      setInviteMessage(response.detail)
      setInviteEmail('')
      setInviteRole('')
      setInviteOpen(false)
    } catch (error) {
      setInviteMessage(error.response?.data?.detail || 'Не удалось отправить приглашение')
    }
  }

  async function handleDeleteMember() {
    if (!memberToDelete) return

    try {
      await deleteProjectMember(memberToDelete.id)

      setMembers((prev) =>
        prev.filter((member) => member.id !== memberToDelete.id)
      )

      setMemberToDelete(null)
    } catch (error) {
      setAlertModal({
        title: 'Ошибка',
        text: 'Не удалось удалить участника',
        type: 'error',
      })
    }
  }

  function openEditMember(member) {
    setEditingMember(member)

    setEditFullName(member.user_name || '')
    setEditGroup(member.user_group_number || '')
    setEditRole(member.role || '')
  }

  async function handleUpdateMember(e) {
    e.preventDefault()

    try {
      await updateProjectMember(editingMember.id, {
        role: editRole,
      })

      await updateUser(editingMember.user, {
        full_name: editFullName,
        group_number: editGroup,
      })

      const updatedMembers = await getProjectMembers(project.id)
      setMembers(updatedMembers)

      setEditingMember(null)
    } catch (error) {
      console.log(error.response?.data)
      showAppAlert('Не удалось обновить участника', 'error')
    }
  }

  async function handleUpdateProjectSettings(e) {
    e.preventDefault()

    setSavingProject(true)

    try {
      const updated = await updateProject(project.id, {
        title: projectTitle,
        description: projectDescription,
        end_date: projectDeadline || null,
      })

      showAppAlert('Настройки проекта сохранены', 'success')
    } catch (error) {
      console.log('Ошибка обновления проекта:', error.response?.data || error)
      showAppAlert('Не удалось сохранить настройки проекта', 'error')
    } finally {
      setSavingProject(false)
    }
  }

  async function handleCompleteProject() {
    try {
      await updateProject(project.id, {
        status: 'completed',
      })

      setCompleteProjectConfirmOpen(false)
      showAppAlert('Проект завершён', 'success')
      window.location.reload()
    } catch (error) {
      console.log('Ошибка завершения проекта:', error.response?.data || error)
      showAppAlert('Не удалось завершить проект', 'error')
    }
  }

  async function handleArchiveProject() {
    try {
      await updateProject(project.id, {
        status: 'archived',
      })

      setArchiveProjectConfirmOpen(false)
      showAppAlert('Проект архивирован', 'success')
      window.location.reload()
    } catch (error) {
      console.log('Ошибка архивации проекта:', error.response?.data || error)
      showAppAlert('Не удалось архивировать проект', 'error')
    }
  }

  async function handleRestoreProject() {
    try {
      await updateProject(project.id, {
        status: 'active',
      })

      setRestoreProjectConfirmOpen(false)
      showAppAlert('Проект возобновлён', 'success')
      window.location.reload()
    } catch (error) {
      console.log('Ошибка восстановления проекта:', error.response?.data || error)
      showAppAlert('Не удалось возобновить проект', 'error')
    }
  }

  async function handleCompleteProject() {
    try {
      await updateProject(project.id, {
        status: 'completed',
      })

      setCompleteProjectConfirmOpen(false)
      showAppAlert('Проект завершён', 'success')
      window.location.reload()
    } catch (error) {
      console.log('Ошибка завершения проекта:', error.response?.data || error)
      showAppAlert('Не удалось завершить проект', 'error')
    }
  }

  async function handleArchiveProject() {
    try {
      await updateProject(project.id, {
        status: 'archived',
      })

      setArchiveProjectConfirmOpen(false)
      showAppAlert('Проект архивирован', 'success')
      window.location.reload()
    } catch (error) {
      console.log('Ошибка архивации проекта:', error.response?.data || error)
      showAppAlert('Не удалось архивировать проект', 'error')
    }
  }

  async function handleRestoreProject() {
    try {
      await updateProject(project.id, {
        status: 'active',
      })

      setRestoreProjectConfirmOpen(false)
      showAppAlert('Проект возобновлён', 'success')
      window.location.reload()
    } catch (error) {
      console.log('Ошибка восстановления проекта:', error.response?.data || error)
      showAppAlert('Не удалось возобновить проект', 'error')
    }
  }

  async function handleDeleteProject() {
    try {
      await deleteProject(project.id)

      setDeleteProjectConfirmOpen(false)
      window.location.reload()
    } catch (error) {
      console.log('Ошибка удаления проекта:', error.response?.data || error)
      showAppAlert('Не удалось удалить проект', 'error')
    }
  }

  const submissions = tasks
    .filter((task) =>
      task.status === 'review' || task.status_display === 'Нужна проверка'
    )
    .map((task) => {
      const taskSubmissions = task.submissions || []

      if (taskSubmissions.length === 0) return null

      const latestSubmission = [...taskSubmissions].sort(
        (a, b) =>
          new Date(b.submitted_at || b.created_at) -
          new Date(a.submitted_at || a.created_at)
      )[0]

      return {
        ...latestSubmission,
        task,
        task_title: task.title,
      }
    })
    .filter(Boolean)

    function openSubmissionTask(submission) {
      setSelectedTask(submission.task)
      navigate(`/projects/${project.id}/tasks`)
    }

  async function handleSaveGrade(e) {
      e.preventDefault()

      if (!gradeStudent || !gradeValue) return

      const payload = {
        project: project.id,
        student: Number(gradeStudent),
        task: gradeTask ? Number(gradeTask) : null,
        reason: gradeReason,
        value: Number(gradeValue),
        comment: gradeComment,
        semester: gradeSemester,
        grade_type: gradeType,
      }

      const saved = editingGrade
        ? await updateGrade(editingGrade.id, payload)
        : await createGrade(payload)

      setGrades((prev) =>
        editingGrade
          ? prev.map((item) => item.id === saved.id ? saved : item)
          : [saved, ...prev]
      )

      setGradeFormOpen(false)
      setEditingGrade(null)
      setGradeStudent('')
      setGradeTask('')
      setGradeReason('')
      setGradeValue('')
      setGradeComment('')
      setGradeType('regular')
      setGradeSemester(selectedSemester)
    }


  useEffect(() => {
    getGrades(project.id)
      .then((data) => setGrades(data))
      .catch((error) => console.log('Ошибка загрузки оценок:', error))
  }, [project.id])


  const semesterGrades = grades.filter(
    (grade) => grade.semester === selectedSemester
  )

  const detailGrades = semesterGrades.filter((grade) => {
    const matchesStudent = gradeStudentFilter
      ? Number(grade.student) === Number(gradeStudentFilter)
      : true

    const dateValue = grade.graded_at || grade.created_at

    const gradeDate = dateValue
      ? new Date(dateValue)
      : null

    const fromDate = gradeDateFrom
      ? new Date(gradeDateFrom)
      : null

    const toDate = gradeDateTo
      ? new Date(gradeDateTo)
      : null

    const matchesFrom = fromDate && gradeDate
      ? gradeDate >= fromDate
      : true

    const matchesTo = toDate && gradeDate
      ? gradeDate <= new Date(toDate.setHours(23, 59, 59, 999))
      : true

    return matchesStudent && matchesFrom && matchesTo
  })


  function openEditGrade(grade) {
    setEditingGrade(grade)
    setGradeStudent(grade.student || '')
    setGradeTask(grade.task || '')
    setGradeReason(grade.reason || '')
    setGradeValue(grade.value || '')
    setGradeComment(grade.comment || '')
    setGradeType(grade.grade_type || 'regular')
    setGradeSemester(grade.semester || selectedSemester)
    setGradeFormOpen(true)
  }

  async function handleDeleteGrade() {
    if (!gradeToDelete) return

    await deleteGrade(gradeToDelete.id)

    setGrades((prev) =>
      prev.filter((grade) => grade.id !== gradeToDelete.id)
    )

    setGradeToDelete(null)
  }

  useEffect(() => {
    getAttendance(project.id)
      .then((data) => setAttendanceList(data))
      .catch((error) => console.log('Ошибка загрузки посещаемости:', error))
  }, [project.id])

  const attendanceDates = [
    ...new Set([
      ...attendanceList.map((item) => item.date),
      ...attendanceExtraDates,
    ]),
  ].sort()

  const studentMembers = members.filter(
    (member) => member.user_role === 'student'
  )

  function getAttendanceCell(studentId, date) {
    return attendanceList.find(
      (item) =>
        Number(item.student) === Number(studentId) &&
        item.date === date
    )
  }

  async function handleAttendanceChange(studentId, date, value) {
    if (!value) return

    const existing = getAttendanceCell(studentId, date)

    if (existing) {
      const updated = await updateAttendance(existing.id, {
        status: value,
      })

      setAttendanceList((prev) =>
        prev.map((item) =>
          item.id === updated.id ? updated : item
        )
      )

      return
    }

    const created = await createAttendance({
      project: project.id,
      student: studentId,
      date,
      status: value,
    })

    setAttendanceList((prev) => [...prev, created])
  }

  function handleAddAttendanceDate() {
    if (!attendanceDate) {
      setAttendanceError('Выберите дату занятия')
      return
    }

    setAttendanceExtraDates((prev) =>
      prev.includes(attendanceDate)
        ? prev
        : [...prev, attendanceDate]
    )

    setAttendanceDate('')
  }

  async function handleDeleteAttendanceDate() {
    if (!attendanceDateToDelete) return

    await deleteAttendanceDate(project.id, attendanceDateToDelete)

    setAttendanceList((prev) =>
      prev.filter((item) => item.date !== attendanceDateToDelete)
    )

    setAttendanceExtraDates((prev) =>
      prev.filter((item) => item !== attendanceDateToDelete)
    )

    setAttendanceDateToDelete(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
      
      <section className="space-y-5">
        {activeSection === 'members' && (
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Участники</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Управление участниками проекта и их ролями.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Пригласить
              </button>
            </div>

            {inviteMessage && (
              <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                {inviteMessage}
              </div>
            )}

            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              className="mb-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Поиск по ФИО, роли или группе"
            />

            <div className="space-y-3">
              {visibleMembers.length > 0 ? (
                visibleMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div>
                      <div className="font-semibold">
                        {member.user_name || 'Пользователь'}
                      </div>

                      {member.user_role === 'student' && (
                        <div className="mt-1 text-xs text-slate-400">
                          Группа: {member.user_group_number || 'не указана'}
                        </div>
                      )}

                      <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Роль в проекте: {member.role || 'не указана'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEditMember(member)}
                        className="text-sm font-semibold text-slate-500 hover:text-violet-600"
                        title="Редактировать"
                      >
                      <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setMemberToDelete(member)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        title="Удалить из проекта"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                  Участники пока не добавлены.
                </div>
              )}
            </div>
          </Card>
        )}

        {activeSection === 'reviews' && (
          <Card className="p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold">Проверка ответов</h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Ответы студентов, ожидающие проверки.
              </p>
            </div>

            <div className="space-y-3">
              {submissions.length > 0 ? (
                submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">
                          {submission.student_name || 'Студент'}
                        </div>

                        <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {submission.task_title || 'Задача'}
                        </div>

                        <div className="mt-2 text-xs text-slate-400">
                          {submission.submitted_at
                            ? new Date(submission.submitted_at).toLocaleString('ru-RU')
                            : 'Дата неизвестна'}
                        </div>
                      </div>
                    </div>

                    {submission.text_answer && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800/70">
                        {submission.text_answer}
                      </div>
                    )}

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => openSubmissionTask(submission)}
                        className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                      >
                        Просмотреть
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                  Ответов на проверку пока нет.
                </div>
              )}
            </div>
          </Card>
        )}

        {activeSection === 'grades' && (
        <Card className="p-6">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold">Журнал оценок</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Оценки по семестрам, аттестациям и детальным записям.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="autumn">Осенний семестр</option>
                <option value="spring">Весенний семестр</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setEditingGrade(null)
                  setGradeStudent('')
                  setGradeTask('')
                  setGradeReason('')
                  setGradeValue('')
                  setGradeComment('')
                  setGradeType('regular')
                  setGradeSemester(selectedSemester)
                  setGradeFormOpen(true)
                }}
                className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Добавить оценку
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                <tr>
                  <th className="p-4 font-semibold">Студент</th>
                  <th className="p-4 font-semibold">Первая атт.</th>
                  <th className="p-4 font-semibold">Вторая атт.</th>
                  <th className="p-4 font-semibold">Промеж. атт.</th>
                  <th className="p-4 font-semibold">Семестровая</th>
                </tr>
              </thead>

              <tbody>
                {members
                  .filter((member) => member.user_role === 'student')
                  .map((student) => {
                    const studentGrades = semesterGrades.filter(
                      (grade) => Number(grade.student) === Number(student.user)
                    )

                    const first = studentGrades.find((grade) => grade.grade_type === 'first_attestation')
                    const second = studentGrades.find((grade) => grade.grade_type === 'second_attestation')
                    const intermediate = studentGrades.find((grade) => grade.grade_type === 'intermediate_attestation')
                    const semesterTotal = studentGrades.find((grade) => grade.grade_type === 'semester_total')

                    return (
                      <tr key={student.user} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="p-4 font-semibold">
                          {student.user_name || 'Студент'}
                        </td>

                        {[first, second, intermediate, semesterTotal].map((grade, index) => (
                          <td key={index} className="p-4">
                            {grade ? (
                              <span className="inline-flex rounded-xl bg-violet-50 px-3 py-1 font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                                {grade.value}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-bold">Детальные записи</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Все выставленные оценки выбранного семестра.
              Можно отфильтровать по студенту и периоду.
              </p>

            <div className="mt-4 mb-4 flex items-end justify-end gap-3">
              <select
                value={gradeStudentFilter}
                onChange={(e) => setGradeStudentFilter(e.target.value)}
                className="h-12 rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Все студенты</option>

                {members
                  .filter((member) => member.user_role === 'student')
                  .map((member) => (
                    <option key={member.user} value={member.user}>
                      {member.user_name}
                    </option>
                  ))}
              </select>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">
                  Период с
                </span>

                <input
                  type="date"
                  value={gradeDateFrom}
                  onChange={(e) => setGradeDateFrom(e.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-400">
                  по
                </span>

                <input
                  type="date"
                  value={gradeDateTo}
                  onChange={(e) => setGradeDateTo(e.target.value)}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              {(gradeStudentFilter || gradeDateFrom || gradeDateTo) && (
                <button
                  type="button"
                  onClick={() => {
                    setGradeStudentFilter('')
                    setGradeDateFrom('')
                    setGradeDateTo('')
                  }}
                  className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            {detailGrades.length > 0 ? (
              <table className="w-full border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Дата
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Студент
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Основание
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Оценка
                    </th>

                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Комментарий
                    </th>

                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      Действия
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {detailGrades.map((grade) => (
                    <tr
                      key={grade.id}
                      className="border-t border-slate-200 dark:border-slate-800"
                    >
                      <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {grade.graded_at || grade.created_at
                          ? new Date(
                              grade.graded_at || grade.created_at
                            ).toLocaleDateString('ru-RU')
                          : '—'}
                      </td>

                      <td className="px-4 py-4 font-semibold">
                        {grade.student_name || 'Студент'}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {grade.task_title
                          ? `Задача: ${grade.task_title}`
                          : grade.grade_type_display ||
                            grade.reason ||
                            'Без основания'}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-xl bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          {grade.value}
                        </span>
                      </td>

                      <td className="max-w-xs px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {grade.comment || '—'}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => openEditGrade(grade)}
                            className="text-sm font-semibold text-slate-500 hover:text-violet-600"
                          >
                          <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setGradeToDelete(grade)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                Оценок пока нет.
              </div>
            )}
          </div>
        </Card>
      )}

        {activeSection === 'settings' && (
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Настройки проекта</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Редактирование данных проекта, статуса и опасные действия.
              </p>
            </div>

            <form onSubmit={handleUpdateProjectSettings} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Название проекта
                </label>
                <input
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Введите название проекта"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Описание проекта
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Введите описание проекта"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Дедлайн проекта
                </label>
                <input
                  type="date"
                  value={projectDeadline || ''}
                  onChange={(e) => setProjectDeadline(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={savingProject}
                  className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {savingProject ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                {project.status !== 'archived' && project.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => setCompleteProjectConfirmOpen(true)}
                    className="rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                  >
                    Завершить проект
                  </button>
                )}

                {project.status !== 'archived' && (
                  <button
                    type="button"
                    onClick={() => setArchiveProjectConfirmOpen(true)}
                    className="rounded-2xl border border-violet-200 px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300 dark:hover:bg-violet-950/30"
                  >
                    Архивировать проект
                  </button>
                )}

                {(project.status === 'archived' || project.status === 'completed') && (
                  <button
                    type="button"
                    onClick={() => setRestoreProjectConfirmOpen(true)}
                    className="rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-950/30"
                  >
                    Возобновить проект
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDeleteProjectConfirmOpen(true)}
                  className="rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                >
                  Удалить проект
                </button>
              </div>
            </form>
          </Card>
        )}

        {activeSection === 'attendance' && (
          <Card className="p-6">
            <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-bold">Журнал посещаемости</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Отмечайте посещение студентов по датам занятий.
                </p>
              </div>

              <div className="flex gap-3">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => {
                    setAttendanceDate(e.target.value)
                    setAttendanceError('')
                  }}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                />

                <button
                  type="button"
                  onClick={handleAddAttendanceDate}
                  className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Добавить дату
                </button>
              </div>
            </div>

            {attendanceError && (
              <div className="mt-2 text-sm text-red-500">
                {attendanceError}
              </div>
            )}

            <div className="mb-4 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span><b>Я</b> — явился</span>
              <span><b>Б</b> — болел</span>
              <span><b>Н</b> — не явился</span>
            </div>
          <div className="max-h-[520px] max-w-full overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="sticky left-0 z-10 w-12 border-r border-slate-200 bg-slate-50 px-3 py-3 text-left font-semibold dark:border-slate-800 dark:bg-slate-900">
                      №
                    </th>

                    <th className="sticky left-12 z-10 min-w-[260px] border-r border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold dark:border-slate-800 dark:bg-slate-900">
                      ФИО студента
                    </th>

                    {attendanceDates.map((date) => (
                      <th
                        key={date}
                        className="group relative min-w-[80px] border-r border-slate-200 px-2 py-3 text-center text-xs font-semibold dark:border-slate-800"
                        title={new Date(date).toLocaleDateString('ru-RU')}
                      >
                        <span>
                          {new Date(date).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>

                        <button
                          type="button"
                          onClick={() => setAttendanceDateToDelete(date)}
                          className="absolute right-1 top-1 hidden rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 group-hover:flex dark:hover:bg-red-950/30"
                          title="Удалить дату"
                        >
                          <Trash2 size={12} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {studentMembers.length > 0 ? (
                    studentMembers.map((student, index) => (
                      <tr
                        key={student.user}
                        className="border-t border-slate-200 dark:border-slate-800"
                      >
                        <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
                          {index + 1}
                        </td>

                        <td className="sticky left-12 z-10 border-r border-slate-200 bg-white px-4 py-3 font-semibold dark:border-slate-800 dark:bg-slate-900">
                          <div>{student.user_name || 'Студент'}</div>
                          <div className="mt-1 text-xs font-normal text-slate-400">
                            Группа: {student.user_group_number || 'не указана'}
                          </div>
                        </td>

                        {attendanceDates.map((date) => {
                          const cell = getAttendanceCell(student.user, date)

                          return (
                            <td
                              key={`${student.user}-${date}`}
                              className="border-r border-slate-200 px-2 py-2 text-center dark:border-slate-800"
                            >
                              <select
                                value={cell?.status || ''}
                                onChange={(e) =>
                                  handleAttendanceChange(
                                    student.user,
                                    date,
                                    e.target.value
                                  )
                                }
                                className="h-9 w-12 rounded-xl border border-slate-200 bg-white text-center text-sm font-bold outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                              >
                                <option value="">—</option>
                                <option value="present">Я</option>
                                <option value="sick">Б</option>
                                <option value="absent">Н</option>
                              </select>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={attendanceDates.length + 2}
                        className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400"
                      >
                        В проекте пока нет студентов.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
      
      <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 px-3">
          <div className="font-bold">
            Панель
          </div>
          <div className="font-bold">
            Преподавателя
          </div>
        </div>

        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => navigate(`/projects/${project.id}/teacher/${section.id}`)}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium ${
                activeSection === section.id
                  ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      {memberToDelete && (
        <ConfirmModal
          title="Удалить участника?"
          text={`Участник «${memberToDelete.user_name || 'Пользователь'}» будет удалён из проекта.`}
          confirmText="Да, удалить"
          danger
          onConfirm={handleDeleteMember}
          onCancel={() => setMemberToDelete(null)}
        />
      )}

      {attendanceDateToDelete && (
        <ConfirmModal
          title="Удалить дату?"
          text={`Дата ${new Date(attendanceDateToDelete).toLocaleDateString('ru-RU')} будет удалена из журнала посещаемости.`}
          confirmText="Да, удалить"
          danger
          onConfirm={handleDeleteAttendanceDate}
          onCancel={() => setAttendanceDateToDelete(null)}
        />
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-xl font-bold">Пригласить студента</h3>

            <form onSubmit={handleInvite} className="mt-5 space-y-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder="Email студента"
              />

              <input
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder="Роль в проекте, например Тимлид"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Пригласить
                </button>

                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Отменить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-xl font-bold">
              Редактирование участника
            </h3>

            <form onSubmit={handleUpdateMember} className="mt-5 space-y-3">
              <input
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder="ФИО"
              />

              {editingMember.user_role === 'student' && (
                <input
                  value={editGroup}
                  onChange={(e) => setEditGroup(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Группа"
                />
              )}

              <input
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder="Роль в проекте"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Сохранить
                </button>

                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {gradeFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-xl font-bold">
              {editingGrade ? 'Изменить оценку' : 'Добавить оценку'}
            </h3>

            <form onSubmit={handleSaveGrade} className="mt-5 space-y-3">

              <select
                value={gradeSemester}
                onChange={(e) => setGradeSemester(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="autumn">Осенний семестр</option>
                <option value="spring">Весенний семестр</option>
              </select>

              <select
                value={gradeType}
                onChange={(e) => setGradeType(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="regular">Обычная оценка</option>
                <option value="first_attestation">Первая аттестация</option>
                <option value="second_attestation">Вторая аттестация</option>
                <option value="intermediate_attestation">Промежуточная аттестация</option>
                <option value="semester_total">Семестровая оценка</option>
              </select>

              <select
                value={gradeStudent}
                onChange={(e) => setGradeStudent(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Выберите студента</option>
                {members
                  .filter((member) => member.user_role === 'student')
                  .map((member) => (
                    <option key={member.user} value={member.user}>
                      {member.user_name}
                    </option>
                  ))}
              </select>

              <select
                value={gradeTask}
                onChange={(e) => setGradeTask(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="">Без привязки к задаче</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>

              <input
                value={gradeReason}
                onChange={(e) => setGradeReason(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder="Основание, например: Предзащита / Семестр"
              />

              <input
                type="number"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder="Оценка"
              />

              <textarea
                value={gradeComment}
                onChange={(e) => setGradeComment(e.target.value)}
                className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-800"
                placeholder="Комментарий"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                >
                  Сохранить
                </button>

                <button
                  type="button"
                  onClick={() => setGradeFormOpen(false)}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {gradeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-xl font-bold">Удалить оценку?</h3>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Оценка «{gradeToDelete.value}» будет удалена без возможности восстановления.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleDeleteGrade}
                className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Да, удалить
              </button>

              <button
                type="button"
                onClick={() => setGradeToDelete(null)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}


      {completeProjectConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-xl font-bold">Завершить проект?</h3>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Проект получит статус «Завершён». После этого система сможет отправить его в архив.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCompleteProject}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Да, завершить
              </button>

              <button
                type="button"
                onClick={() => setCompleteProjectConfirmOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {restoreProjectConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-xl font-bold">Возобновить проект?</h3>

            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Проект вернётся из архива и снова станет активным.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleRestoreProject}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Да, возобновить
              </button>

              <button
                type="button"
                onClick={() => setRestoreProjectConfirmOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {archiveProjectConfirmOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
      <h3 className="text-xl font-bold">Архивировать проект?</h3>

      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        Проект будет помечен как архивный. Его данные сохранятся в системе.
      </p>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={handleArchiveProject}
          className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
        >
          Архивировать
        </button>

        <button
          type="button"
          onClick={() => setArchiveProjectConfirmOpen(false)}
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Отмена
        </button>
      </div>
    </div>
  </div>
)}

    {deleteProjectConfirmOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
          <h3 className="text-xl font-bold">Удалить проект?</h3>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Проект и связанные данные будут удалены без возможности восстановления.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleDeleteProject}
              className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              Да, удалить
            </button>

            <button
              type="button"
              onClick={() => setDeleteProjectConfirmOpen(false)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    )}

    {alertModal && (
      <AlertModal
        title={alertModal.title}
        text={alertModal.text}
        type={alertModal.type}
        onClose={() => setAlertModal(null)}
      />
    )}

    </div>
  )
}