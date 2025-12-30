import { useState, useEffect, useRef } from 'react';
import './VariableRemuneration.css';
import { usersAPI, peerRatingAPI, variableRemunerationAPI } from '../services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VariableRemuneration = () => {
    const { canAccessFeature } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const contentRef = useRef(null);
    
    // Check if user has permission to manage variable remuneration
    const canManage = canAccessFeature('remuneration.variable');

    // Get current month and year
    const currentDate = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = monthNames[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersResponse, ratingsResponse, savedResponse] = await Promise.all([
                    usersAPI.getForPeerRating(),
                    peerRatingAPI.getAverageRatings(currentMonth, currentYear),
                    variableRemunerationAPI.get(currentMonth, currentYear)
                ]);

                if (usersResponse.success && usersResponse.users) {
                    console.log('Fetched users:', usersResponse.users);

                    const filteredUsers = usersResponse.users.filter(
                        user => user.role !== 'FACULTY_IN_CHARGE' && user.role !== 'OFFICER_IN_CHARGE'
                    );

                    console.log('Filtered users:', filteredUsers);

                    const averageRatings = ratingsResponse.success ? ratingsResponse.averages : {};
                    const savedRemuneration = savedResponse.success ? savedResponse.remunerationMap : {};

                    const mappedEmployees = filteredUsers.map(user => {
                        const savedData = savedRemuneration[user._id];
                        // If saved data exists, use it. But for peerRating, always use the fresh calculated average.
                        // This ensures that if peer ratings change, they are reflected here even if other fields were saved.

                        return {
                            id: user._id,
                            name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.username,
                            designation: user.employment?.designation || user.role,
                            maxRemuneration: 10000, // Default
                            punctuality: savedData?.punctuality ?? "",
                            sincerity: savedData?.sincerity ?? "",
                            responsiveness: savedData?.responsiveness ?? "",
                            assignedTask: savedData?.assignedTask ?? "",
                            peerRating: (averageRatings[user._id] !== undefined) ? averageRatings[user._id] : (savedData?.peerRating || 0),
                        };
                    });

                    setEmployees(mappedEmployees);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const calculateTotalScore = (emp) => {
        const p = parseFloat(emp.punctuality) || 0;
        const s = parseFloat(emp.sincerity) || 0;
        const r = parseFloat(emp.responsiveness) || 0;
        const a = parseFloat(emp.assignedTask) || 0;
        const pr = parseFloat(emp.peerRating) || 0;
        return p + s + r + a + pr;
    };

    const calculatePercentage = (totalScore) => {
        if (totalScore > 80) return 100;
        if (totalScore >= 60) return 90;
        if (totalScore >= 50) return 80;
        if (totalScore >= 40) return 50;
        if (totalScore >= 30) return 40;
        return 30;
    };

    const handleScoreChange = (id, field, value) => {
        // Check permission before allowing changes
        if (!canManage) {
            alert('You do not have permission to manage variable remuneration.');
            return;
        }
        
        // Validate input (0-20)
        let numValue = value === "" ? "" : parseFloat(value);
        if (numValue !== "" && (numValue < 0 || numValue > 20)) return;

        setEmployees(employees.map(emp =>
            emp.id === id ? { ...emp, [field]: value } : emp
        ));
    };

    const handleSave = async () => {
        // Check permission before saving
        if (!canManage) {
            alert('You do not have permission to manage variable remuneration.');
            return;
        }
        
        setSaving(true);
        try {
            const remunerationData = employees.map(emp => {
                const totalScore = calculateTotalScore(emp);
                const percentage = calculatePercentage(totalScore);
                const amount = (emp.maxRemuneration * percentage) / 100;

                return {
                    employeeId: emp.id,
                    punctuality: emp.punctuality,
                    sincerity: emp.sincerity,
                    responsiveness: emp.responsiveness,
                    assignedTask: emp.assignedTask,
                    peerRating: emp.peerRating,
                    totalScore,
                    percentage,
                    amount
                };
            });

            await variableRemunerationAPI.save(remunerationData, currentMonth, currentYear);
            alert('Remuneration data saved successfully!');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Failed to save data. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!contentRef.current) return;

        const actionsDiv = document.querySelector('.remuneration-actions');
        if (actionsDiv) actionsDiv.style.display = 'none';

        const container = contentRef.current;
        const tableContainer = container.querySelector('.table-container');
        
        // Store original styles
        const originalContainerStyle = {
            width: container.style.width,
            maxWidth: container.style.maxWidth,
            overflow: container.style.overflow,
            height: container.style.height,
            minHeight: container.style.minHeight,
        };

        const originalTableContainerStyle = {
            overflow: tableContainer ? tableContainer.style.overflow : '',
            maxWidth: tableContainer ? tableContainer.style.maxWidth : '',
            width: tableContainer ? tableContainer.style.width : '',
        };

        // Apply styles to ensure full content is visible
        container.style.width = 'fit-content';
        container.style.maxWidth = 'none';
        container.style.overflow = 'visible';
        container.style.height = 'auto';
        container.style.minHeight = 'auto';
        container.classList.add('pdf-print-mode');

        if (tableContainer) {
            tableContainer.style.overflow = 'visible';
            tableContainer.style.maxWidth = 'none';
            tableContainer.style.width = 'auto';
        }

        // Force input values to be visible for PDF
        const inputs = container.querySelectorAll('input[type="number"]');
        const inputData = [];
        inputs.forEach((input) => {
            inputData.push({
                element: input,
                parent: input.parentElement,
                value: input.value,
                nextSibling: input.nextSibling
            });
            const span = document.createElement('span');
            span.className = 'pdf-value-display';
            span.textContent = input.value || '0';
            span.style.cssText = 'font-size: 0.85rem; color: #000; display: inline-block;';
            input.style.display = 'none';
            input.parentElement.insertBefore(span, input.nextSibling);
        });

        // Force browser to recalculate layout
        void container.offsetHeight;

        setTimeout(() => {
            // Recursively calculate total height of all elements including nested ones
            const calculateElementHeight = (element) => {
                const styles = window.getComputedStyle(element);
                const marginTop = parseFloat(styles.marginTop) || 0;
                const marginBottom = parseFloat(styles.marginBottom) || 0;
                const paddingTop = parseFloat(styles.paddingTop) || 0;
                const paddingBottom = parseFloat(styles.paddingBottom) || 0;
                
                let height = element.offsetHeight + marginTop + marginBottom;
                
                // For elements with children, ensure we account for child heights
                if (element.children.length > 0) {
                    let childrenHeight = 0;
                    Array.from(element.children).forEach(child => {
                        const childStyles = window.getComputedStyle(child);
                        const childMarginTop = parseFloat(childStyles.marginTop) || 0;
                        const childMarginBottom = parseFloat(childStyles.marginBottom) || 0;
                        childrenHeight += child.offsetHeight + childMarginTop + childMarginBottom;
                    });
                    height = Math.max(height, childrenHeight + paddingTop + paddingBottom + marginTop + marginBottom);
                }
                
                return height;
            };

            // Calculate total height of all direct children
            const children = Array.from(container.children);
            let totalHeight = 0;
            children.forEach(child => {
                totalHeight += calculateElementHeight(child);
            });

            // Add container padding
            const containerStyles = window.getComputedStyle(container);
            const paddingTop = parseFloat(containerStyles.paddingTop) || 0;
            const paddingBottom = parseFloat(containerStyles.paddingBottom) || 0;
            totalHeight += paddingTop + paddingBottom;

            // Add significant buffer to ensure signature section is captured
            totalHeight += 100;

            // Ensure we capture the complete content with proper dimensions
            const fullWidth = Math.max(container.scrollWidth, container.offsetWidth);
            const fullHeight = Math.max(container.scrollHeight, container.offsetHeight, totalHeight);

            console.log('Capturing PDF with dimensions:', { 
                fullWidth, 
                fullHeight, 
                calculatedHeight: totalHeight,
                scrollHeight: container.scrollHeight,
                offsetHeight: container.offsetHeight 
            });

            html2canvas(container, {
                scale: 1.5,
                useCORS: true,
                logging: true,
                width: fullWidth,
                height: fullHeight,
                windowWidth: fullWidth,
                windowHeight: fullHeight,
                scrollY: -window.scrollY,
                scrollX: -window.scrollX,
                allowTaint: true,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    const clonedContainer = clonedDoc.querySelector('.remuneration-container');
                    if (clonedContainer) {
                        clonedContainer.style.height = fullHeight + 'px';
                        clonedContainer.style.overflow = 'visible';
                    }
                }
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;

                console.log('Canvas dimensions:', { imgWidth, imgHeight });

                // Create PDF with proper aspect ratio to fit all content
                const pdf = new jsPDF({
                    orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [imgWidth / 1.5, imgHeight / 1.5],
                    compress: true
                });

                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth / 1.5, imgHeight / 1.5, '', 'FAST');
                pdf.save(`Variable_Remuneration_${currentMonth}_${currentYear}.pdf`);

                // Restore original state
                container.classList.remove('pdf-print-mode');
                inputData.forEach(data => {
                    data.element.style.display = '';
                    const span = data.parent.querySelector('.pdf-value-display');
                    if (span) span.remove();
                });

                if (actionsDiv) actionsDiv.style.display = 'flex';
                container.style.width = originalContainerStyle.width;
                container.style.maxWidth = originalContainerStyle.maxWidth;
                container.style.overflow = originalContainerStyle.overflow;
                container.style.height = originalContainerStyle.height;
                container.style.minHeight = originalContainerStyle.minHeight;

                if (tableContainer) {
                    tableContainer.style.overflow = originalTableContainerStyle.overflow;
                    tableContainer.style.maxWidth = originalTableContainerStyle.maxWidth;
                    tableContainer.style.width = originalTableContainerStyle.width;
                }
            }).catch(err => {
                console.error('PDF generation failed:', err);

                // Restore original state on error
                container.classList.remove('pdf-print-mode');
                inputData.forEach(data => {
                    data.element.style.display = '';
                    const span = data.parent.querySelector('.pdf-value-display');
                    if (span) span.remove();
                });

                if (actionsDiv) actionsDiv.style.display = 'flex';
                container.style.width = originalContainerStyle.width;
                container.style.maxWidth = originalContainerStyle.maxWidth;
                container.style.overflow = originalContainerStyle.overflow;
                container.style.height = originalContainerStyle.height;
                container.style.minHeight = originalContainerStyle.minHeight;

                if (tableContainer) {
                    tableContainer.style.overflow = originalTableContainerStyle.overflow;
                    tableContainer.style.maxWidth = originalTableContainerStyle.maxWidth;
                    tableContainer.style.width = originalTableContainerStyle.width;
                }
            });
        }, 500);
    };

    return (
        <div className="remuneration-page-container">
            <div className="remuneration-actions">
                {canManage && (
                    <button
                        className="action-btn save-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Ratings'}
                    </button>
                )}
                <button
                    className="action-btn download-btn"
                    onClick={handleDownloadPDF}
                >
                    <Download size={18} />
                    Download PDF
                </button>
            </div>

            <div className="remuneration-container" ref={contentRef}>
                <div className="remuneration-header">
                    <h2>NIT Raipur Foundation for Innovation & Entrepreneurship (NITRR-FIE)</h2>
                    <h3>Variable Remuneration of Contractual Employees for the Month <span className="highlight-date">{currentMonth} {currentYear}</span></h3>
                </div>

                <div className="table-container">
                    <table className="remuneration-table">
                        <thead>
                            <tr>
                                <th>S.No.</th>
                                <th>Name</th>
                                <th>Designation / Engagement</th>
                                <th>Maximum Variable Remuneration (In Rs.)</th>
                                <th>Punctuality (Out of 20)</th>
                                <th>Sincerity (Out of 20)</th>
                                <th>Responsiveness (Out of 20)</th>
                                <th>Assigned Task (Out of 20)</th>
                                <th>Peer Rating (Out of 20)</th>
                                <th>Total Score (Out of 100)</th>
                                <th>Total % of Variable Remuneration Recommended</th>
                                <th>Variable Remuneration Recommended (in Rs.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp, index) => {
                                const totalScore = calculateTotalScore(emp);
                                const percentage = calculatePercentage(totalScore);
                                const recommendedAmount = (emp.maxRemuneration * percentage) / 100;

                                return (
                                    <tr key={emp.id}>
                                        <td>{index + 1}</td>
                                        <td>{emp.name}</td>
                                        <td className="designation-cell">{emp.designation}</td>
                                        <td>{emp.maxRemuneration.toFixed(2)}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="score-input"
                                                value={emp.punctuality}
                                                onChange={(e) => handleScoreChange(emp.id, 'punctuality', e.target.value)}
                                                readOnly={!canManage}
                                                style={!canManage ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="score-input"
                                                value={emp.sincerity}
                                                onChange={(e) => handleScoreChange(emp.id, 'sincerity', e.target.value)}
                                                max="20"
                                                min="0"
                                                readOnly={!canManage}
                                                style={!canManage ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="score-input"
                                                value={emp.responsiveness}
                                                onChange={(e) => handleScoreChange(emp.id, 'responsiveness', e.target.value)}
                                                max="20"
                                                min="0"
                                                readOnly={!canManage}
                                                style={!canManage ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="score-input"
                                                value={emp.assignedTask}
                                                onChange={(e) => handleScoreChange(emp.id, 'assignedTask', e.target.value)}
                                                max="20"
                                                min="0"
                                                readOnly={!canManage}
                                                style={!canManage ? { backgroundColor: '#f5f5f5', cursor: 'not-allowed' } : {}}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="score-input"
                                                value={emp.peerRating}
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                            />
                                        </td>
                                        <td className="total-score">{totalScore}</td>
                                        <td className="percentage">{percentage}%</td>
                                        <td className="recommended-amount">{recommendedAmount.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="certifications">
                    <p>1) Certified that the above employee(s) have delivered their duty satisfactorily during the mentioned month.</p>
                    <p>2) Certified that Approval of Competent Authority is available for deployment of above employees.</p>
                    <p>3) Forwarded to the concerned team for the release of Variable Remuneration to the above employee(s) as per rating and recommendation.</p>
                </div>

                <div className="signature-section">
                    <div className="signature">
                        <p>Faculty In-Charge</p>
                        <p>Incubation Cell, NIT Raipur</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariableRemuneration;
