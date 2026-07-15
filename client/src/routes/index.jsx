import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Suspense, lazy } from "react";

// Layout
import MainLayout from "../layouts/MainLayout";

// Public Pages
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Home = lazy(() => import("../pages/Home"));
const DoctorsPage = lazy(() => import("../pages/DoctorsPage"));

// Dashboards
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const DoctorDashboard = lazy(() => import("../pages/doctor/DoctorDashboard"));
const PatientDashboard = lazy(() =>
  import("../pages/patient/PatientDashboard")
);
const ReceptionistDashboard = lazy(() =>
  import("../pages/receptionist/ReceptionistDashboard")
);
const PharmacistDashboard = lazy(() =>
  import("../pages/pharmacist/PharmacistDashboard")
);
const LabDashboard = lazy(() =>
  import("../pages/lab/LabDashboard")
);

// Patient Pages
const PatientRegistration = lazy(() =>
  import("../pages/patient/PatientRegistration")
);

const PatientProfile = lazy(() =>
  import("../pages/patient/PatientProfile")
);

const AppointmentBooking = lazy(() =>
  import("../pages/patient/AppointmentBooking")
);

const MedicalHistory = lazy(() =>
  import("../pages/patient/MedicalHistory")
);

// Doctor Pages
const Diagnosis = lazy(() =>
  import("../pages/doctor/Diagnosis")
);

const Prescription = lazy(() =>
  import("../pages/doctor/Prescription")
);

const FollowUp = lazy(() =>
  import("../pages/doctor/FollowUp")
);

const HomeRoute = () => {
  const { isAuthenticated } = useAuthStore();

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Home />
  );
};

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-background">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Testing Routes */}
          <Route path="/test-register" element={<PatientRegistration />} />
          <Route path="/test-profile" element={<PatientProfile />} />
          <Route path="/test-appointment" element={<AppointmentBooking />} />
          <Route path="/test-history" element={<MedicalHistory />} />
          <Route path="/test-diagnosis" element={<Diagnosis />} />
          <Route path="/test-prescription" element={<Prescription />} />
          <Route path="/test-followup" element={<FollowUp />} />

          <Route element={<MainLayout />}>

            {/* Dashboard */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<RoleBasedDashboard />} />
            </Route>

            {/* Admin */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="admin" element={<AdminDashboard />} />
            </Route>

            {/* Doctor */}
            <Route element={<ProtectedRoute allowedRoles={["DOCTOR"]} />}>
              <Route path="doctor" element={<DoctorDashboard />} />
              <Route path="doctor/diagnosis" element={<Diagnosis />} />
              <Route path="doctor/prescription" element={<Prescription />} />
              <Route path="doctor/followup" element={<FollowUp />} />
            </Route>

            {/* Patient */}
            <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
              <Route path="patient" element={<PatientDashboard />} />
              <Route
                path="patient/register"
                element={<PatientRegistration />}
              />
              <Route
                path="patient/profile"
                element={<PatientProfile />}
              />
              <Route
                path="patient/appointment"
                element={<AppointmentBooking />}
              />
              <Route
                path="patient/history"
                element={<MedicalHistory />}
              />
            </Route>

            {/* Receptionist */}
            <Route element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]} />}>
              <Route
                path="reception"
                element={<ReceptionistDashboard />}
              />
            </Route>

            {/* Pharmacist */}
            <Route element={<ProtectedRoute allowedRoles={["PHARMACIST"]} />}>
              <Route
                path="pharmacy"
                element={<PharmacistDashboard />}
              />
            </Route>

            {/* Lab */}
            <Route element={<ProtectedRoute allowedRoles={["LAB_STAFF"]} />}>
              <Route path="lab" element={<LabDashboard />} />
            </Route>

          </Route>

          <Route
            path="/unauthorized"
            element={
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-error">
                  Unauthorized
                </h1>
                <p>You do not have permission to view this page.</p>
              </div>
            }
          />

          <Route
            path="*"
            element={
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">
                  404 - Not Found
                </h1>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const RoleBasedDashboard = () => {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "ADMIN":
      return <Navigate to="/admin" replace />;
    case "DOCTOR":
      return <Navigate to="/doctor" replace />;
    case "PATIENT":
      return <Navigate to="/patient" replace />;
    case "RECEPTIONIST":
      return <Navigate to="/reception" replace />;
    case "PHARMACIST":
      return <Navigate to="/pharmacy" replace />;
    case "LAB_STAFF":
      return <Navigate to="/lab" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default AppRoutes;