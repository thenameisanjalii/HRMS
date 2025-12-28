import { useState, useEffect } from 'react';
import { 
    Shield, Plus, Edit2, Trash2, Save, X, AlertCircle, 
    CheckCircle, Users, Settings, RefreshCw, Database 
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('roles');
    const [roles, setRoles] = useState([]);
    const [components, setComponents] = useState([]);
    const [features, setFeatures] = useState([]);
    const [roleGroups, setRoleGroups] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [showRoleGroupHelper, setShowRoleGroupHelper] = useState(false);
    
    const [editForm, setEditForm] = useState({
        roleId: '',
        displayName: '',
        hierarchyLevel: 3,
        description: '',
        componentAccess: [],
        featureAccess: [],
        isActive: true
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesData, componentsData, statsData] = await Promise.all([
                adminAPI.getRoles(),
                adminAPI.getComponents(),
                adminAPI.getStats()
            ]);
            
            if (rolesData.success) setRoles(rolesData.roles);
            if (componentsData.success) {
                console.log('Components data received:', componentsData);
                console.log('Features from backend:', componentsData.features);
                setComponents(componentsData.components);
                setFeatures(componentsData.features || []);
                setRoleGroups(componentsData.roleGroups || []);
            }
            if (statsData.success) setStats(statsData.stats);
        } catch (error) {
            showNotification('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSelectRole = (role) => {
        setSelectedRole(role);
        setEditForm({
            roleId: role.roleId,
            displayName: role.displayName,
            hierarchyLevel: role.hierarchyLevel,
            description: role.description || '',
            componentAccess: role.componentAccess || [],
            featureAccess: role.featureAccess || [],
            isActive: role.isActive
        });
        setIsEditing(false);
    };

    const handleComponentToggle = (componentId) => {
        const componentName = components.find(c => c.id === componentId)?.name || componentId;
        const existingIndex = editForm.componentAccess.findIndex(c => c.componentId === componentId);
        
        if (existingIndex >= 0) {
            const updated = [...editForm.componentAccess];
            updated[existingIndex].hasAccess = !updated[existingIndex].hasAccess;
            setEditForm({ ...editForm, componentAccess: updated });
        } else {
            setEditForm({
                ...editForm,
                componentAccess: [
                    ...editForm.componentAccess,
                    { componentId, componentName, hasAccess: true }
                ]
            });
        }
    };

    const hasComponentAccess = (componentId) => {
        const comp = editForm.componentAccess.find(c => c.componentId === componentId);
        return comp?.hasAccess || false;
    };

    const handleFeatureToggle = (featureId) => {
        const featureName = features.find(f => f.id === featureId)?.name || featureId;
        const existingIndex = editForm.featureAccess.findIndex(f => f.featureId === featureId);
        
        if (existingIndex >= 0) {
            const updated = [...editForm.featureAccess];
            updated[existingIndex].hasAccess = !updated[existingIndex].hasAccess;
            setEditForm({ ...editForm, featureAccess: updated });
        } else {
            setEditForm({
                ...editForm,
                featureAccess: [
                    ...editForm.featureAccess,
                    { featureId, featureName, hasAccess: true }
                ]
            });
        }
    };

    const hasFeatureAccess = (featureId) => {
        const feat = editForm.featureAccess.find(f => f.featureId === featureId);
        return feat?.hasAccess || false;
    };

    const handleRoleGroupSelect = (roleGroupId) => {
        const roleGroup = roleGroups.find(rg => rg.id === roleGroupId);
        if (!roleGroup) return;

        // Get current role's ID (from SYSTEM_ROLES or database)
        const currentRoleId = editForm.roleId;
        
        // Check if current role is in this group
        const isInGroup = roleGroup.roles.includes(currentRoleId);
        
        // Apply role group settings to all components
        const updatedComponentAccess = components.map(component => {
            const existingAccess = editForm.componentAccess.find(c => c.componentId === component.id);
            return {
                componentId: component.id,
                componentName: component.name,
                hasAccess: isInGroup ? (component.defaultRoleGroup === roleGroupId || existingAccess?.hasAccess || false) : (existingAccess?.hasAccess || false)
            };
        });

        setEditForm({
            ...editForm,
            componentAccess: updatedComponentAccess
        });

        showNotification(`Applied ${roleGroup.name} permissions`, 'success');
    };

    const handleBulkComponentAccess = (grant) => {
        const updatedComponentAccess = components.map(component => ({
            componentId: component.id,
            componentName: component.name,
            hasAccess: grant
        }));

        setEditForm({
            ...editForm,
            componentAccess: updatedComponentAccess
        });

        showNotification(grant ? 'Granted all component access' : 'Revoked all component access', 'success');
    };

    const handleBulkFeatureAccess = (grant) => {
        const updatedFeatureAccess = features.map(feature => ({
            featureId: feature.id,
            featureName: feature.name,
            hasAccess: grant
        }));

        setEditForm({
            ...editForm,
            featureAccess: updatedFeatureAccess
        });

        showNotification(grant ? 'Granted all feature access' : 'Revoked all feature access', 'success');
    };

    const handleSaveRole = async () => {
        try {
            console.log('Saving role with data:', editForm);
            const response = await adminAPI.updateRole(editForm.roleId, editForm);
            console.log('Update response:', response);
            if (response.success) {
                showNotification('Role updated successfully', 'success');
                fetchData();
                setIsEditing(false);
                setSelectedRole(response.role);
            } else {
                showNotification(response.message || 'Failed to update role', 'error');
            }
        } catch (error) {
            console.error('Error saving role:', error);
            showNotification('Failed to update role', 'error');
        }
    };

    const handleCreateRole = async () => {
        try {
            const response = await adminAPI.createRole(editForm);
            if (response.success) {
                showNotification('Role created successfully', 'success');
                fetchData();
                setShowAddModal(false);
                resetForm();
            } else {
                showNotification(response.message || 'Failed to create role', 'error');
            }
        } catch (error) {
            showNotification('Failed to create role', 'error');
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (!confirm(`Are you sure you want to delete this role? This action cannot be undone.`)) {
            return;
        }
        
        try {
            const response = await adminAPI.deleteRole(roleId);
            if (response.success) {
                showNotification('Role deleted successfully', 'success');
                fetchData();
                setSelectedRole(null);
            } else {
                showNotification(response.message || 'Failed to delete role', 'error');
            }
        } catch (error) {
            showNotification('Failed to delete role', 'error');
        }
    };

    const handleInitialize = async () => {
        if (!confirm('Initialize default roles? This will create standard role configurations.')) {
            return;
        }
        
        try {
            const response = await adminAPI.initializeRoles();
            if (response.success) {
                showNotification(`Initialized ${response.count} roles successfully`, 'success');
                fetchData();
            } else {
                showNotification(response.message || 'Failed to initialize', 'error');
            }
        } catch (error) {
            showNotification('Failed to initialize roles', 'error');
        }
    };

    const resetForm = () => {
        setEditForm({
            roleId: '',
            displayName: '',
            hierarchyLevel: 3,
            description: '',
            componentAccess: [],
            featureAccess: [],
            isActive: true
        });
    };

    if (loading) {
        return (
            <div className="admin-panel">
                <div className="admin-loading">
                    <RefreshCw className="spin" size={32} />
                    <p>Loading admin panel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            {/* Notification */}
            {notification && (
                <div className={`admin-notification ${notification.type}`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-left">
                    <Shield size={32} className="admin-icon" />
                    <div>
                        <h1>Admin Panel</h1>
                        <p>Manage roles and permissions</p>
                    </div>
                </div>
                <div className="admin-header-right">
                    <button className="admin-btn admin-btn-secondary" onClick={fetchData}>
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                    <button className="admin-btn admin-btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        New Role
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                        <div className="stat-icon blue">
                            <Shield size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Total Roles</span>
                            <span className="stat-value">{stats.totalRoles}</span>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon green">
                            <CheckCircle size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Active Roles</span>
                            <span className="stat-value">{stats.activeRoles}</span>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon orange">
                            <Settings size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">System Roles</span>
                            <span className="stat-value">{stats.systemRoles}</span>
                        </div>
                    </div>
                    <div className="admin-stat-card">
                        <div className="stat-icon purple">
                            <Users size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Custom Roles</span>
                            <span className="stat-value">{stats.customRoles}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="admin-content-grid">
                {/* Roles List */}
                <div className="admin-card roles-list-card">
                    <div className="card-header">
                        <h2>Roles</h2>
                        <button className="admin-btn-icon" onClick={handleInitialize} title="Initialize Default Roles">
                            <Database size={18} />
                        </button>
                    </div>
                    <div className="roles-list">
                        {roles.map((role) => (
                            <div
                                key={role.roleId}
                                className={`role-item ${selectedRole?.roleId === role.roleId ? 'active' : ''}`}
                                onClick={() => handleSelectRole(role)}
                            >
                                <div className="role-item-main">
                                    <div className="role-badge" data-level={role.hierarchyLevel}>
                                        {role.displayName}
                                    </div>
                                    {role.isSystemRole && <span className="system-badge">System</span>}
                                </div>
                                <div className="role-item-meta">
                                    <span className="role-level">Level {role.hierarchyLevel}</span>
                                    <span className={`role-status ${role.isActive ? 'active' : 'inactive'}`}>
                                        {role.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Role Editor */}
                <div className="admin-card role-editor-card">
                    {selectedRole ? (
                        <>
                            <div className="card-header">
                                <div>
                                    <h2>{editForm.displayName}</h2>
                                    <p className="role-id">{editForm.roleId}</p>
                                </div>
                                <div className="card-actions">
                                    {isEditing ? (
                                        <>
                                            <button className="admin-btn admin-btn-secondary" onClick={() => {
                                                setIsEditing(false);
                                                handleSelectRole(selectedRole);
                                            }}>
                                                <X size={18} />
                                                Cancel
                                            </button>
                                            <button className="admin-btn admin-btn-success" onClick={handleSaveRole}>
                                                <Save size={18} />
                                                Save
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="admin-btn admin-btn-primary" onClick={() => setIsEditing(true)}>
                                                <Edit2 size={18} />
                                                Edit
                                            </button>
                                            {!selectedRole.isSystemRole && (
                                                <button 
                                                    className="admin-btn admin-btn-danger" 
                                                    onClick={() => handleDeleteRole(selectedRole.roleId)}
                                                >
                                                    <Trash2 size={18} />
                                                    Delete
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="role-editor-content">
                                {/* Basic Info */}
                                <div className="editor-section">
                                    <h3>Basic Information</h3>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Display Name</label>
                                            <input
                                                type="text"
                                                value={editForm.displayName}
                                                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Hierarchy Level (0=Highest)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="10"
                                                value={editForm.hierarchyLevel}
                                                onChange={(e) => setEditForm({ ...editForm, hierarchyLevel: parseInt(e.target.value) })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            disabled={!isEditing}
                                            rows="2"
                                        />
                                    </div>
                                </div>

                                {/* Component Access */}
                                <div className="editor-section">
                                    <div className="section-header-with-actions">
                                        <h3>Component Access</h3>
                                        <div className="section-actions">
                                            <button 
                                                className="admin-btn-small admin-btn-secondary"
                                                onClick={() => setShowRoleGroupHelper(!showRoleGroupHelper)}
                                                disabled={!isEditing}
                                                type="button"
                                            >
                                                {showRoleGroupHelper ? 'Hide' : 'Show'} Role Groups
                                            </button>
                                            <button 
                                                className="admin-btn-small admin-btn-success"
                                                onClick={() => handleBulkComponentAccess(true)}
                                                disabled={!isEditing}
                                                type="button"
                                            >
                                                Grant All
                                            </button>
                                            <button 
                                                className="admin-btn-small admin-btn-danger"
                                                onClick={() => handleBulkComponentAccess(false)}
                                                disabled={!isEditing}
                                                type="button"
                                            >
                                                Revoke All
                                            </button>
                                        </div>
                                    </div>

                                    {/* Role Group Helper */}
                                    {showRoleGroupHelper && (
                                        <div className="role-group-helper">
                                            <p className="helper-title">Quick Apply Role Group Permissions:</p>
                                            <div className="role-group-buttons">
                                                {roleGroups.map((rg) => (
                                                    <button
                                                        key={rg.id}
                                                        type="button"
                                                        className="role-group-btn"
                                                        onClick={() => handleRoleGroupSelect(rg.id)}
                                                        disabled={!isEditing}
                                                        title={rg.description}
                                                    >
                                                        <span className="rg-name">{rg.name}</span>
                                                        <span className="rg-roles">{rg.roles.length} roles</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="helper-note">
                                                💡 Tip: Select a role group to automatically configure component access based on common patterns
                                            </p>
                                        </div>
                                    )}

                                    <div className="permissions-grid">
                                        {components.map((component) => {
                                            const defaultGroup = roleGroups.find(rg => rg.id === component.defaultRoleGroup);
                                            return (
                                                <div key={component.id} className="permission-item">
                                                    <label className="permission-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={hasComponentAccess(component.id)}
                                                            onChange={() => handleComponentToggle(component.id)}
                                                            disabled={!isEditing}
                                                        />
                                                        <div className="permission-info">
                                                            <span className="permission-name">{component.name}</span>
                                                            <span className="permission-desc">{component.description}</span>
                                                            {defaultGroup && (
                                                                <span className="permission-default-group">
                                                                    Default: {defaultGroup.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Feature Access */}
                                <div className="editor-section">
                                    <div className="section-header-with-actions">
                                        <h3>Feature Access</h3>
                                        <div className="section-actions">
                                            <button 
                                                className="admin-btn-small admin-btn-success"
                                                onClick={() => handleBulkFeatureAccess(true)}
                                                disabled={!isEditing}
                                                type="button"
                                            >
                                                Grant All
                                            </button>
                                            <button 
                                                className="admin-btn-small admin-btn-danger"
                                                onClick={() => handleBulkFeatureAccess(false)}
                                                disabled={!isEditing}
                                                type="button"
                                            >
                                                Revoke All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="permissions-grid">
                                        {features.length === 0 ? (
                                            <div className="no-features-message" style={{
                                                padding: '2rem',
                                                textAlign: 'center',
                                                color: '#666',
                                                backgroundColor: '#f8f9fa',
                                                borderRadius: '8px',
                                                gridColumn: '1 / -1'
                                            }}>
                                                <p>No features found in database. Features from all roles will appear here.</p>
                                                <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
                                                    Run <code>node backend/seedRoles.js</code> to seed initial features.
                                                </p>
                                            </div>
                                        ) : (
                                            features.map((feature) => {
                                                const defaultGroup = roleGroups.find(rg => rg.id === feature.defaultRoleGroup);
                                                return (
                                                    <div key={feature.id} className="permission-item">
                                                        <label className="permission-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={hasFeatureAccess(feature.id)}
                                                                onChange={() => handleFeatureToggle(feature.id)}
                                                                disabled={!isEditing}
                                                            />
                                                            <div className="permission-info">
                                                                <span className="permission-name">{feature.name}</span>
                                                                <span className="permission-desc">{feature.description}</span>
                                                                {defaultGroup && (
                                                                    <span className="permission-default-group">
                                                                        Default: {defaultGroup.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="editor-section">
                                    <h3>Status</h3>
                                    <label className="toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={editForm.isActive}
                                            onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                            disabled={!isEditing}
                                        />
                                        <span>Role is active and can be assigned to users</span>
                                    </label>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="no-selection">
                            <Shield size={64} />
                            <h3>No Role Selected</h3>
                            <p>Select a role from the list to view and edit its permissions</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Role Modal */}
            {showAddModal && (
                <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Role</h2>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-content">
                            <div className="form-group">
                                <label>Role ID (UPPERCASE, NO SPACES)</label>
                                <input
                                    type="text"
                                    value={editForm.roleId}
                                    onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                                    placeholder="e.g., HR_MANAGER"
                                />
                            </div>
                            <div className="form-group">
                                <label>Display Name</label>
                                <input
                                    type="text"
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                                    placeholder="e.g., HR Manager"
                                />
                            </div>
                            <div className="form-group">
                                <label>Hierarchy Level (0=Highest, 3=Lowest)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={editForm.hierarchyLevel}
                                    onChange={(e) => setEditForm({ ...editForm, hierarchyLevel: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    placeholder="Role description..."
                                    rows="3"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="admin-btn admin-btn-secondary" onClick={() => {
                                setShowAddModal(false);
                                resetForm();
                            }}>
                                Cancel
                            </button>
                            <button 
                                className="admin-btn admin-btn-primary" 
                                onClick={handleCreateRole}
                                disabled={!editForm.roleId || !editForm.displayName}
                            >
                                Create Role
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
