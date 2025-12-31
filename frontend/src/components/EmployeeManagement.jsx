import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Filter,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  X,
  Save,
  User,
  Calendar,
  Building,
  Badge,
} from "lucide-react";
import { usersAPI, authAPI, getPhotoUrl } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./EmployeeManagement.css";

const EmployeeManagement = () => {
  const { user, canAccessFeature } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    employeeId: "",
    username: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    profile: {
      firstName: "",
      lastName: "",
      phone: "",
    },
    employment: {
      designation: "",
      department: "",
    },
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await usersAPI.getAll();
      if (data.success) {
        setEmployees(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (
      !newEmployee.employeeId ||
      !newEmployee.username ||
      !newEmployee.email ||
      !newEmployee.password
    ) {
      alert("Please fill all required fields");
      return;
    }
    try {
      const data = await authAPI.register(newEmployee);
      if (data.success) {
        alert("Employee added successfully");
        setShowAddModal(false);
        setNewEmployee({
          employeeId: "",
          username: "",
          email: "",
          password: "",
          role: "EMPLOYEE",
          profile: { firstName: "", lastName: "", phone: "" },
          employment: { designation: "", department: "" },
        });
        fetchEmployees();
      } else {
        alert(data.message || "Failed to add employee");
      }
    } catch (error) {
      alert("Failed to add employee");
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      const data = await usersAPI.delete(id);
      if (data.success) {
        fetchEmployees();
      } else {
        alert(data.message || "Failed to delete employee");
      }
    } catch (error) {
      alert("Failed to delete employee");
    }
  };

  const handleViewProfile = (emp) => {
    setSelectedEmployee(emp);
    setShowProfileModal(true);
  };

  const getEmployeeName = (emp) => {
    if (emp.profile?.firstName) {
      return `${emp.profile.firstName} ${emp.profile.lastName || ""}`;
    }
    return emp.username;
  };

  const getAvatar = (emp) => {
    if (emp.profile?.firstName) {
      return `${emp.profile.firstName[0]}${emp.profile.lastName?.[0] || ""}`;
    }
    return emp.username.substring(0, 2).toUpperCase();
  };

  const filteredEmployees = employees.filter((emp) => {
    const excludedRoles = ["FACULTY_IN_CHARGE", "OFFICER_IN_CHARGE", "ADMIN"];
    if (excludedRoles.includes(emp.role)) return false;

    const name = getEmployeeName(emp).toLowerCase();
    const role = (emp.employment?.designation || emp.role || "").toLowerCase();
    const department = (emp.employment?.department || "").toLowerCase();
    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) ||
      role.includes(searchTerm.toLowerCase()) ||
      department.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || emp.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "success";
      case "On Leave":
        return "warning";
      case "Remote":
        return "info";
      case "Terminated":
        return "danger";
      default:
        return "success";
    }
  };

  if (loading) {
    return (
      <div className="employee-container">
        <p>Loading employees...</p>
      </div>
    );
  }

  // Use database permissions for feature access
  const canAddEmployee = canAccessFeature("employee.create");
  const canDeleteEmployee = canAccessFeature("employee.delete");
  const canEditEmployee = canAccessFeature("employee.edit");
  const canViewAll = canAccessFeature("employee.viewAll");

  return (
    <div className="employee-container">
      <div className="emp-header">
        <div className="header-title">
          <h2>Employee Directory</h2>
          <p>Manage your workforce details and status</p>
        </div>
        {canAddEmployee && (
          <button className="add-btn" onClick={() => setShowAddModal(true)}>
            <Plus size={20} /> Add Employee
          </button>
        )}
      </div>

      {showAddModal && (
        <div className="emp-modal-overlay">
          <div className="emp-modal-content">
            <div className="emp-modal-header">
              <h3>Add New Employee</h3>
              <button
                className="emp-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="emp-modal-body">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Employee ID *"
                  value={newEmployee.employeeId}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      employeeId: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Username *"
                  value={newEmployee.username}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, username: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <input
                  type="email"
                  placeholder="Email *"
                  value={newEmployee.email}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, email: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="Password *"
                  value={newEmployee.password}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, password: e.target.value })
                  }
                />
                <select
                  value={newEmployee.role}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, role: e.target.value })
                  }
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="First Name"
                  value={newEmployee.profile.firstName}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      profile: {
                        ...newEmployee.profile,
                        firstName: e.target.value,
                      },
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newEmployee.profile.lastName}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      profile: {
                        ...newEmployee.profile,
                        lastName: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Phone"
                  value={newEmployee.profile.phone}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      profile: {
                        ...newEmployee.profile,
                        phone: e.target.value,
                      },
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Designation"
                  value={newEmployee.employment.designation}
                  onChange={(e) =>
                    setNewEmployee({
                      ...newEmployee,
                      employment: {
                        ...newEmployee.employment,
                        designation: e.target.value,
                      },
                    })
                  }
                />
              </div>
              {/* <div className="form-row">
                                <input type="text" placeholder="Department" value={newEmployee.employment.department} onChange={(e) => setNewEmployee({...newEmployee, employment: {...newEmployee.employment, department: e.target.value}})} />
                            </div> */}
            </div>
            <div className="emp-modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button className="save-btn" onClick={handleAddEmployee}>
                <Save size={18} /> Save Employee
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="emp-controls">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="emp-grid">
        {filteredEmployees.length === 0 ? (
          <p className="no-employees">No employees found</p>
        ) : (
          filteredEmployees.map((emp) => (
            <div key={emp._id} className="emp-card glass-panel">
              <div className="emp-profile">
                <div className="emp-avatar">
                  {emp.profile?.photo ? (
                    <img
                      src={getPhotoUrl(emp.profile.photo)}
                      alt={getEmployeeName(emp)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <span>{getAvatar(emp)}</span>
                  )}
                </div>
                <h3>{getEmployeeName(emp)}</h3>
                <span className="emp-role">
                  {emp.employment?.designation || emp.role}
                </span>
              </div>

              <div className="emp-details">
                <div className="detail-row">
                  <Briefcase size={16} />
                  <span>{emp.employment?.department || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <Mail size={16} />
                  <span>{emp.email}</span>
                </div>
                <div className="detail-row">
                  <Phone size={16} />
                  <span>{emp.profile?.phone || "N/A"}</span>
                </div>
                <div className="detail-row">
                  <MapPin size={16} />
                  <span>
                    Joined:{" "}
                    {emp.employment?.joiningDate
                      ? new Date(
                          emp.employment.joiningDate
                        ).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="view-btn"
                  onClick={() => handleViewProfile(emp)}
                >
                  View Profile
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Employee Profile Modal */}
      {showProfileModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="profile-modal">
            {/* 1. Header with Close Button */}
            <div className="modal-header-modern">
              <button
                className="close-btn-floating"
                onClick={() => setShowProfileModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* 2. Banner Area */}
            <div className="profile-banner"></div>

            {/* 3. Main Content - Scrollable */}
            <div className="profile-content-wrapper">
              {/* Identity Section (Avatar & Name) */}
              <div className="profile-identity">
                <div className="avatar-wrapper">
                  <div className="profile-avatar-xl">
                    {selectedEmployee.profile?.photo ? (
                      <img
                        src={getPhotoUrl(selectedEmployee.profile.photo)}
                        alt={getEmployeeName(selectedEmployee)}
                      />
                    ) : (
                      <span>{getAvatar(selectedEmployee)}</span>
                    )}
                  </div>
                </div>

                <div className="identity-text">
                  <h2>{getEmployeeName(selectedEmployee)}</h2>
                  <div className="identity-badges">
                    <span className="role-text">
                      <Badge size={16} />
                      {selectedEmployee.employment?.designation ||
                        selectedEmployee.role}
                    </span>
                    <span
                      className={`status-badge ${getStatusColor(
                        selectedEmployee.status || "Active"
                      )}`}
                    >
                      {selectedEmployee.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="profile-grid">
                {/* Card 1: Personal Info */}
                <div className="info-card">
                  <div className="card-header">
                    <div className="card-icon">
                      <User size={18} />
                    </div>
                    <h4>Personal Information</h4>
                  </div>
                  <div className="data-group">
                    <div className="data-item">
                      <span className="data-label">Employee ID</span>
                      <span className="data-value">
                        {selectedEmployee.employeeId || "N/A"}
                      </span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Personal Email</span>
                      <span
                        className="data-value"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {selectedEmployee.profile?.personalEmail || "N/A"}
                      </span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Blood Group</span>
                      <span className="data-value">
                        {selectedEmployee.profile?.bloodGroup || "N/A"}
                      </span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Date of Birth</span>
                      <span className="data-value">
                        {selectedEmployee.profile?.dateOfBirth
                          ? new Date(
                              selectedEmployee.profile.dateOfBirth
                            ).toLocaleDateString("en-IN")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Gender</span>
                      <span className="data-value">
                        {selectedEmployee.profile?.gender || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Contact Info */}
                <div className="info-card">
                  <div className="card-header">
                    <div className="card-icon">
                      <Phone size={18} />
                    </div>
                    <h4>Contact Details</h4>
                  </div>
                  <div className="data-group">
                    <div className="data-item">
                      <span className="data-label">Email</span>
                      <span
                        className="data-value"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {selectedEmployee.email}
                      </span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Phone</span>
                      <span className="data-value">
                        {selectedEmployee.profile?.phone || "N/A"}
                      </span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Department</span>
                      <span className="data-value">
                        {selectedEmployee.employment?.department || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Employment */}
                <div className="info-card">
                  <div className="card-header">
                    <div className="card-icon">
                      <Building size={18} />
                    </div>
                    <h4>Employment</h4>
                  </div>
                  <div className="data-group">
                    <div className="data-item">
                      <span className="data-label">Designation</span>
                      <span className="data-value">
                        {selectedEmployee.employment?.designation || "N/A"}
                      </span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Joining Date</span>
                      <span className="data-value">
                        {selectedEmployee.employment?.joiningDate
                          ? new Date(
                              selectedEmployee.employment.joiningDate
                            ).toLocaleDateString("en-IN")
                          : "N/A"}
                      </span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">System Role</span>
                      <span className="data-value">
                        {selectedEmployee.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 4: Address (Full Width) */}
                <div className="info-card">
                  <div className="card-header">
                    <div className="card-icon">
                      <MapPin size={18} />
                    </div>
                    <h4>Address</h4>
                  </div>
                  <div className="data-group">
                    <div className="data-item">
                      <span className="data-label">Residential Address</span>
                      <span className="data-value">
                        {selectedEmployee.profile?.address
                          ? [
                              selectedEmployee.profile.address.street,
                              selectedEmployee.profile.address.city,
                              selectedEmployee.profile.address.state,
                              selectedEmployee.profile.address.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ") || "N/A"
                          : "N/A"}
                      </span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Personal Address</span>
                      <span className="data-value">
                        {selectedEmployee.profile?.personalAddress
                          ? [
                              selectedEmployee.profile.personalAddress.street,
                              selectedEmployee.profile.personalAddress.city,
                              selectedEmployee.profile.personalAddress.state,
                              selectedEmployee.profile.personalAddress.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ") || "N/A"
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Footer Actions */}
            <div className="modal-footer-modern">
              {canDeleteEmployee && (
                <button
                  className="btn-danger-ghost"
                  onClick={() => {
                    handleDeleteEmployee(selectedEmployee._id);
                    setShowProfileModal(false);
                  }}
                >
                  Delete Employee
                </button>
              )}
              <button
                className="btn-ghost"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
