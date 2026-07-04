import React, { useEffect, useState } from 'react';
import api from '../api/api';
import '../styles/adminPage.css';

function AdminMessagingPage({ currentUser }) {
    const [users, setUsers] = useState([]);
    const [courses, setCourses] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCampaignLoading, setIsCampaignLoading] = useState(false);
    const [error, setError] = useState('');
    const [campaignError, setCampaignError] = useState('');
    const [campaignSuccess, setCampaignSuccess] = useState('');
    const [campaignForm, setCampaignForm] = useState({
        subject: '',
        body: '',
        audienceType: 'all_users',
        audienceFilter: {
            userId: '',
            courseId: '',
            category: ''
        }
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/admin/users');
                setUsers(response.data.filter(user => user.role === 'student' && user._id !== currentUser?._id));
            } catch (err) {
                console.error('שגיאה בטעינת משתמשים:', err);
                setError('לא ניתן היה לטעון את רשימת המשתמשים.');
            }
        };

        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses', { params: { limit: 100, page: 1 } });
                setCourses(response.data.items || []);
            } catch (err) {
                console.error('שגיאה בטעינת קורסים:', err);
            }
        };

        const fetchCampaigns = async () => {
            try {
                const response = await api.get('/admin/messages/campaigns');
                setCampaigns(response.data.items || []);
            } catch (err) {
                console.error('שגיאה בטעינת קמפיינים:', err);
            }
        };

        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchUsers(), fetchCourses(), fetchCampaigns()]);
            setIsLoading(false);
        };

        loadData();
    }, [currentUser]);

    const handleCampaignChange = (event) => {
        const { name, value } = event.target;

        if (name === 'audienceType') {
            setCampaignForm((prev) => ({
                ...prev,
                audienceType: value,
                audienceFilter: {
                    userId: '',
                    courseId: '',
                    category: ''
                }
            }));
            return;
        }

        if (name.startsWith('audienceFilter.')) {
            const filterKey = name.split('.')[1];
            setCampaignForm((prev) => ({
                ...prev,
                audienceFilter: {
                    ...prev.audienceFilter,
                    [filterKey]: value
                }
            }));
            return;
        }

        setCampaignForm((prev) => ({
            ...prev,
            [name]: value
        }));

        if (campaignError || campaignSuccess) {
            setCampaignError('');
            setCampaignSuccess('');
        }
    };

    const buildAudienceFilter = () => {
        if (campaignForm.audienceType === 'single_user') {
            return { userId: campaignForm.audienceFilter.userId };
        }

        if (campaignForm.audienceType === 'course_enrollees') {
            return { courseId: campaignForm.audienceFilter.courseId };
        }

        if (campaignForm.audienceType === 'category') {
            return { category: campaignForm.audienceFilter.category };
        }

        return null;
    };

    const handleSendCampaign = async (event) => {
        event.preventDefault();

        setCampaignError('');
        setCampaignSuccess('');

        if (!campaignForm.subject.trim() || !campaignForm.body.trim()) {
            setCampaignError('נא למלא נושא וגוף ההודעה.');
            return;
        }

        const payload = {
            subject: campaignForm.subject.trim(),
            body: campaignForm.body.trim(),
            audienceType: campaignForm.audienceType,
            audienceFilter: buildAudienceFilter()
        };

        if (campaignForm.audienceType !== 'all_users' && Object.values(payload.audienceFilter || {}).every((value) => !value)) {
            setCampaignError('נא לבחור פילטר לקהל היעד.');
            return;
        }

        try {
            setIsCampaignLoading(true);
            const response = await api.post('/admin/messages/campaigns', payload);
            setCampaignSuccess(`נשלחו ${response.data.sentCount} הודעות בהצלחה, ${response.data.failedCount} נכשלו.`);
            setCampaignForm({
                subject: '',
                body: '',
                audienceType: 'all_users',
                audienceFilter: { userId: '', courseId: '', category: '' }
            });

            const campaignsResponse = await api.get('/admin/messages/campaigns');
            setCampaigns(campaignsResponse.data.items || []);
        } catch (err) {
            console.error('שגיאה בשליחת קמפיין:', err);
            setCampaignError(err.response?.data?.error || 'לא ניתן היה לשלוח את ההודעה.');
        } finally {
            setIsCampaignLoading(false);
        }
    };

    if (isLoading) return <div className="admin-page">טוען מרכז הודעות...</div>;
    if (error) return <div className="admin-page">{error}</div>;

    return (
        <div className="admin-page">
            <h1 className="admin-title">מרכז הודעות </h1>

            <section className="admin-campaign-section">
                <h2 className="admin-section-title">שליחת הודעה</h2>

                <form className="admin-campaign-form" onSubmit={handleSendCampaign}>
                    <div className="admin-campaign-grid">
                        <label className="admin-field">
                            <span>נושא</span>
                            <input
                                name="subject"
                                value={campaignForm.subject}
                                onChange={handleCampaignChange}
                                className="admin-input"
                                placeholder="נושא ההודעה"
                            />
                        </label>

                        <label className="admin-field">
                            <span>קהל יעד</span>
                            <select name="audienceType" value={campaignForm.audienceType} onChange={handleCampaignChange} className="admin-input">
                                <option value="all_users">כל המשתמשים</option>
                                <option value="course_enrollees">נרשמי קורס מסוים</option>
                                <option value="category">קטגוריה</option>
                                <option value="single_user">משתמש בודד</option>
                            </select>
                        </label>
                    </div>

                    {campaignForm.audienceType === 'single_user' && (
                        <label className="admin-field">
                            <span>משתמש</span>
                            <select name="audienceFilter.userId" value={campaignForm.audienceFilter.userId} onChange={handleCampaignChange} className="admin-input">
                                <option value="">בחר משתמש</option>
                                {users.map((user) => (
                                    <option key={user._id} value={user._id}>{user.name} ({user.email})</option>
                                ))}
                            </select>
                        </label>
                    )}

                    {campaignForm.audienceType === 'course_enrollees' && (
                        <label className="admin-field">
                            <span>קורס</span>
                            <select name="audienceFilter.courseId" value={campaignForm.audienceFilter.courseId} onChange={handleCampaignChange} className="admin-input">
                                <option value="">בחר קורס</option>
                                {courses.length === 0 ? (
                                    <option value="" disabled>אין קורסים זמינים</option>
                                ) : (
                                    courses.map((course) => (
                                        <option key={course.id || course._id} value={course.id || course._id}>{course.courseName}</option>
                                    ))
                                )}
                            </select>
                        </label>
                    )}

                    {campaignForm.audienceType === 'category' && (
                        <label className="admin-field">
                            <span>קטגוריה</span>
                            <input
                                name="audienceFilter.category"
                                value={campaignForm.audienceFilter.category}
                                onChange={handleCampaignChange}
                                className="admin-input"
                                placeholder="שם קטגוריה"
                            />
                        </label>
                    )}

                    <label className="admin-field admin-full-width">
                        <span>גוף ההודעה</span>
                        <textarea
                            name="body"
                            value={campaignForm.body}
                            onChange={handleCampaignChange}
                            className="admin-textarea"
                            rows="5"
                            placeholder="תוכן ההודעה"
                        />
                    </label>

                    {campaignError && <p className="admin-error">{campaignError}</p>}
                    {campaignSuccess && <p className="admin-success">{campaignSuccess}</p>}

                    <button type="submit" className="admin-button admin-send-button" disabled={isCampaignLoading}>
                        {isCampaignLoading ? 'שולח...' : 'שלח הודעה'}
                    </button>
                </form>

                <div className="admin-campaign-history">
                    <h3 className="admin-subsection-title">היסטוריית קמפיינים</h3>

                    {campaigns.length === 0 ? (
                        <p className="admin-empty">לא נשלחו קמפיינים עדיין.</p>
                    ) : (
                        <div className="admin-campaign-list">
                            {campaigns.map((campaign) => (
                                <article key={campaign.id} className="admin-campaign-card">
                                    <p><strong>נושא:</strong> {campaign.subject}</p>
                                    <p><strong>קהל יעד:</strong> {campaign.audienceType}</p>
                                    <p><strong>מספר נמענים:</strong> {campaign.recipientCount}</p>
                                    <p><strong>נשלח ב:</strong> {new Date(campaign.sentAt).toLocaleString('he-IL')}</p>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

export default AdminMessagingPage;
