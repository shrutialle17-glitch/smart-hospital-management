import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Suspense, lazy } from "react";

// Shell Layout
import MainLayout from "../layouts/MainLayout";

// Auth & Public Pages
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Home = lazy(() => import("../pages/Home"));
const DoctorsPage = lazy(() => import("../pages/DoctorsPage"));
const HomeRoute = () => {
  const { isAuthenticated } = useAuthStore();

  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : <Home />;
};

//Dashboards
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const DoctorDashboard = lazy(() => import("../pages/doctor/DoctorDashboard"));
const PatientDashboard = lazy(() => import("../pages/patient/PatientDashboard"),);
const ReceptionistDashboard = lazy(() => import("../pages/receptionist/ReceptionistDashboard"),);
const PharmacistDashboard = lazy(() => import("../pages/pharmacist/PharmacistDashboard"),);
const LabDashboard = lazy(() => import("../pages/lab/LabDashboard"));

const BedManagement = lazy(() => import('../pages/admin/BedManagement'));
const AmbulancePage = lazy(() => import('../pages/admin/AmbulancePage'));
const BloodBankPage = lazy(() => import('../pages/admin/BloodBankPage'));
const EmergencySOS = lazy(() => import('../pages/admin/EmergencySOS'));
const OrganDonationPage = lazy(() => import('../pages/admin/OrganDonationPage'));
const MedicineIntelligence = lazy(() => import('../pages/pharmacist/MedicineIntelligence'));

// Generic List Views for Sidebar
const GenericListPage = lazy(() => import('../pages/GenericListPage'));

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

          <Route element={<MainLayout />}>
            {/* Dynamic Dashboard Route based on Role */}
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<RoleBasedDashboard />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="admin" element={<AdminDashboard />} />
            </Route>

            {/* Shared operations routes for Admin and Receptionist */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']} />}>
              <Route path="operations/beds" element={<BedManagement />} />
              <Route path="operations/ambulance" element={<AmbulancePage />} />
              <Route path="operations/emergency" element={<EmergencySOS />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'LAB_STAFF']} />}>
              <Route path="operations/blood-bank" element={<BloodBankPage />} />
              <Route path="operations/organ-donation" element={<OrganDonationPage />} />
            </Route>

            {/* Doctor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
              <Route path="doctor" element={<DoctorDashboard />} />
              <Route path="doctor/patients" element={
                <GenericListPage
                  title="My Patients"
                  endpoint="/users?role=PATIENT"
                  columns={[
                    { key: 'firstName', label: 'First Name' },
                    { key: 'lastName', label: 'Last Name' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'createdAt', label: 'Registered', render: (i, v) => new Date(v).toLocaleDateString() }
                  ]}
                />
              } />
              <Route path="doctor/schedule" element={
                <GenericListPage
                  title="My Schedule"
                  endpoint="/appointments?limit=50"
                  columns={[
                    { key: 'patient.user.firstName', label: 'Patient', render: (i) => `${i.patient.user.firstName} ${i.patient.user.lastName}` },
                    { key: 'startTime', label: 'Date & Time', render: (i, v) => new Date(v).toLocaleString() },
                    { key: 'status', label: 'Status', render: (i, v) => <span className={`px-2 py-1 text-xs font-bold rounded-full ${v === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{v}</span> }
                  ]}
                />
              } />
            </Route>

            {/* Patient Routes */}
            <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
              <Route path="patient" element={<PatientDashboard />} />
              <Route path="patient/doctors" element={
                <GenericListPage
                  title="Our Doctors"
                  endpoint="/public/doctors"
                  columns={[
                    { key: 'firstName', label: 'Doctor', render: (i) => `Dr. ${i.firstName} ${i.lastName}` },
                    { key: 'doctorProfile.department.name', label: 'Department' },
                    { key: 'doctorProfile.experience', label: 'Experience', render: (i, v) => `${v} Years` },
                    { key: 'doctorProfile.consultationFee', label: 'Fee', render: (i, v) => `₹${v}` },
                    {
                      key: 'id', label: 'Action', render: (i) => (
                        <a href="/patient" className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40">
                          Book
                        </a>
                      )
                    }
                  ]}
                />
              } />
              <Route path="patient/appointments" element={
                <GenericListPage
                  title="My Appointments"
                  endpoint="/appointments?limit=100"
                  columns={[
                    { key: 'doctor.user.lastName', label: 'Doctor', render: (i) => `Dr. ${i.doctor.user.lastName}` },
                    { key: 'startTime', label: 'Date & Time', render: (i, v) => new Date(v).toLocaleString() },
                    { key: 'status', label: 'Status' }
                  ]}
                />
              } />
              <Route path="patient/records" element={
                <GenericListPage
                  title="Medical Records"
                  endpoint="/lab/reports?limit=500"
                  columns={[
                    { key: 'test.name', label: 'Test Name' },
                    { key: 'status', label: 'Status' },
                    { key: 'createdAt', label: 'Date', render: (i, v) => new Date(v).toLocaleDateString() }
                  ]}
                />
              } />
            </Route>

            {/* Receptionist Routes */}
            <Route element={<ProtectedRoute allowedRoles={["RECEPTIONIST"]} />}>
              <Route path="reception" element={<ReceptionistDashboard />} />
            </Route>

            {/* Pharmacist Routes */}
            <Route element={<ProtectedRoute allowedRoles={["PHARMACIST"]} />}>
              <Route path="pharmacy" element={<PharmacistDashboard />} />
            </Route>

            {/* Lab Staff Routes */}
            <Route element={<ProtectedRoute allowedRoles={["LAB_STAFF"]} />}>
              <Route path="lab" element={<LabDashboard />} />
            </Route>

            {/* Common Lists */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']} />}>
              <Route path="patients" element={
                <GenericListPage
                  title="Patient Directory"
                  endpoint="/users?role=PATIENT&limit=100"
                  columns={[
                    { key: 'firstName', label: 'First Name' },
                    { key: 'lastName', label: 'Last Name' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'createdAt', label: 'Registered On', render: (i, v) => new Date(v).toLocaleDateString() }
                  ]}
                />
              } />
              <Route path="appointments" element={
                <GenericListPage
                  title="All Appointments"
                  endpoint="/appointments?limit=50"
                  columns={[
                    { key: 'patient.user.firstName', label: 'Patient', render: (i) => `${i.patient.user.firstName} ${i.patient.user.lastName}` },
                    { key: 'doctor.user.lastName', label: 'Doctor', render: (i) => `Dr. ${i.doctor.user.lastName}` },
                    { key: 'startTime', label: 'Date', render: (i, v) => new Date(v).toLocaleDateString() },
                    { key: 'status', label: 'Status', render: (i, v) => <span className={`px-2 py-1 text-xs font-bold rounded-full ${v === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{v}</span> }
                  ]}
                />
              } />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'LAB_STAFF']} />}>
              <Route path="lab/reports" element={
                <GenericListPage
                  title="Lab Reports"
                  endpoint="/lab/reports?limit=50"
                  columns={[
                    { key: 'test.name', label: 'Test Name' },
                    { key: 'patient.user.firstName', label: 'Patient', render: (i) => `${i.patient.user.firstName} ${i.patient.user.lastName}` },
                    { key: 'status', label: 'Status' },
                    { key: 'createdAt', label: 'Requested On', render: (i, v) => new Date(v).toLocaleDateString() }
                  ]}
                />
              } />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']} />}>
              <Route path="pharmacy/intelligence" element={<MedicineIntelligence />} />
              <Route path="pharmacy/inventory" element={
                <GenericListPage
                  title="Pharmacy Inventory"
                  endpoint="/pharmacy/medicines?limit=50"
                  columns={[
                    { key: 'name', label: 'Medicine Name' },
                    { key: 'category.name', label: 'Category' },
                    { key: 'unitPrice', label: 'Price (₹)', render: (i, v) => `₹${Number(v || 0).toFixed(2)}` },
                    { key: 'stockLevel', label: 'Stock Level', render: (i, v) => <span className={`font-bold ${v < 20 ? 'text-red-500' : 'text-green-500'}`}>{v}</span> }
                  ]}
                />
              } />
              <Route path="pharmacy/history" element={
                <GenericListPage
                  title="Prescription History"
                  endpoint="/pharmacy/prescriptions?limit=50"
                  columns={[
                    { key: 'patient.user.firstName', label: 'Patient', render: (i) => `${i.patient.user.firstName} ${i.patient.user.lastName}` },
                    { key: 'doctor.user.lastName', label: 'Doctor', render: (i) => `Dr. ${i.doctor.user.lastName}` },
                    { key: 'status', label: 'Status', render: (i, v) => <span className={`px-2 py-1 text-xs font-bold rounded-full ${v === 'FULFILLED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{v}</span> },
                    { key: 'createdAt', label: 'Date', render: (i, v) => new Date(v).toLocaleDateString() }
                  ]}
                />
              } />
            </Route>
          </Route>

          <Route
            path="/unauthorized"
            element={
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-error">Unauthorized</h1>
                <p>You do not have permission to view this page.</p>
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">404 - Not Found</h1>
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
