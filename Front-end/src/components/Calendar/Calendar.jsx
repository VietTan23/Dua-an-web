import React, { useState, useEffect } from 'react';
import { Calendar as AntCalendar, Badge, Button, message, Input } from 'antd';
import locale from 'antd/es/calendar/locale/vi_VN';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/plugin/weekday';
import 'dayjs/plugin/localeData';
import 'dayjs/plugin/updateLocale';
import AddEventModal from './AddEventModal';
import axios from 'axios';
import { PlusOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

// Cấu hình locale cho dayjs
dayjs.locale('vi');

// Tùy chỉnh locale cho tiếng Việt
const viLocale = {
  ...locale,
  lang: {
    ...locale.lang,
    shortWeekDays: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    shortMonths: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
    months: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
    weekDays: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
    today: 'Hôm nay',
    now: 'Bây giờ',
    dayFormat: 'DD',
    dateFormat: 'DD/MM/YYYY',
    dateTimeFormat: 'DD/MM/YYYY HH:mm:ss',
    monthFormat: 'MMMM YYYY'
  }
};

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [isAddEventModalVisible, setIsAddEventModalVisible] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [view, setView] = useState('Tháng');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
    // Kiểm tra và xóa sự kiện đã qua thời gian mỗi 5 phút
    const interval = setInterval(() => {
      fetchEvents();
    }, 300000); // 5 phút = 300000ms
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://backendhr-9ti5.onrender.com/api/interviews', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
      // Kiểm tra và xóa sự kiện đã qua ngay sau khi fetch
      await checkAndDeletePastEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      message.error('Không thể tải dữ liệu lịch');
    }
  };

  const checkAndDeletePastEvents = async (currentEvents = events) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const now = dayjs();
      const today = now.startOf('day');
      
      const pastEvents = currentEvents.filter(event => {
        const eventDate = dayjs(event.date).startOf('day');
        const eventEndTime = dayjs(event.endTime);
        
        // Kiểm tra nếu ngày của sự kiện nhỏ hơn ngày hiện tại
        // hoặc nếu cùng ngày thì kiểm tra thời gian kết thúc đã qua chưa
        return eventDate.isBefore(today) || 
               (eventDate.isSame(today) && eventEndTime.isBefore(now));
      });

      if (pastEvents.length > 0) {
        console.log('Found past events to delete:', pastEvents);
        // Xóa từng sự kiện đã qua thời gian
        for (const event of pastEvents) {
          try {
            await axios.delete(`https://backendhr-9ti5.onrender.com/api/interviews/${event._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Successfully deleted event:', event._id);
          } catch (error) {
            console.error(`Error deleting past event ${event._id}:`, error);
          }
        }
        // Cập nhật lại danh sách sự kiện
        fetchEvents();
      }
    } catch (error) {
      console.error('Error checking past events:', error);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const eventsOnDate = events.filter(event => 
      dayjs(event.date).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
    );
    setSelectedDateEvents(eventsOnDate);
  };

  const handleViewEventDetail = (eventId) => {
    navigate(`/calendar/event/${eventId}`);
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => prev.add(1, 'month'));
  };

  const handleViewChange = (newView) => {
    setView(newView);
    // Cập nhật mode cho calendar
    let mode = 'month';
    if (newView === 'Tuần') mode = 'week';
    if (newView === 'Ngày') mode = 'day';
    setCalendarMode(mode);
  };

  const [calendarMode, setCalendarMode] = useState('month');

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="text-base font-bold">
            {currentDate.format('MMMM')} {currentDate.format('YYYY')}
          </div>
          <div className="flex gap-1">
            <Button type="text" size="small" onClick={handlePrevMonth}>&lt;</Button>
            <Button type="text" size="small" onClick={handleNextMonth}>&gt;</Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button 
              className={`px-4 py-1.5 text-sm ${view === 'Ngày' ? 'bg-[#7B61FF] text-white' : 'bg-white'}`}
              onClick={() => handleViewChange('Ngày')}
            >
              Ngày
            </button>
            <button 
              className={`px-4 py-1.5 text-sm ${view === 'Tuần' ? 'bg-[#7B61FF] text-white' : 'bg-white'}`}
              onClick={() => handleViewChange('Tuần')}
            >
              Tuần
            </button>
            <button 
              className={`px-4 py-1.5 text-sm ${view === 'Tháng' ? 'bg-[#E7FE50] text-black' : 'bg-white'}`}
              onClick={() => handleViewChange('Tháng')}
            >
              Tháng
            </button>
          </div>
          <Button 
            type="primary"
            className="bg-[#E7FE50] text-black hover:bg-[#d4eb47] border-none"
            icon={<PlusOutlined />}
            onClick={() => setIsAddEventModalVisible(true)}
          >
            Tạo lịch
          </Button>
        </div>
      </div>
    );
  };

  const customCellRender = (current, info) => {
    if (info.type !== 'date') return null;
    
    const dateEvents = events.filter(event => 
      dayjs(event.date).format('YYYY-MM-DD') === current.format('YYYY-MM-DD')
    );

    return (
      <div className="h-full">
        <ul className="events m-0 p-0">
          {dateEvents.map((event, index) => (
            <li key={event._id || index} className="list-none">
              <div 
                className="cursor-pointer rounded p-1 text-xs mb-1"
                style={{
                  backgroundColor: event.type === 'interview' ? '#E8EAFF' : '#EEF8C1',
                  color: event.type === 'interview' ? '#7B61FF' : '#000'
                }}
                onClick={() => handleViewEventDetail(event._id)}
              >
                {event.title}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const handleAddEvent = async (values) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        return;
      }

      const eventDate = dayjs(values.date);
      const startTime = dayjs(values.startTime);
      const endTime = dayjs(values.endTime);

      const startDateTime = eventDate
        .hour(startTime.hour())
        .minute(startTime.minute())
        .second(0)
        .millisecond(0);

      const endDateTime = eventDate
        .hour(endTime.hour())
        .minute(endTime.minute())
        .second(0)
        .millisecond(0);

      if (endDateTime.isBefore(startDateTime)) {
        message.error('Thời gian kết thúc phải sau thời gian bắt đầu');
        return;
      }

      const formattedData = {
        title: values.title?.trim(),
        date: eventDate.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        eventType: values.eventType,
        location: values.location?.trim() || '',
        room: values.room,
        description: values.description?.trim() || '',
        type: values.type,
        attendees: values.attendees || [],
        candidate: values.assignTo === 'no-candidates' ? null : values.assignTo,
        beforeEvent: values.beforeEvent || 5,
        allDay: values.allDay || false
      };

      if (!formattedData.title) {
        message.error('Vui lòng nhập tiêu đề');
        return;
      }

      if (!formattedData.candidate) {
        message.error('Vui lòng chọn ứng viên');
        return;
      }

      const response = await axios.post('https://backendhr-9ti5.onrender.com/api/interviews', formattedData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201 || response.status === 200) {
        message.success('Thêm sự kiện thành công');
        setIsAddEventModalVisible(false);
        fetchEvents();
      }
    } catch (error) {
      console.error('Error adding event:', error);
      if (error.response?.status === 401) {
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
      } else {
        const errorMessage = error.response?.data?.message || 'Không thể thêm sự kiện';
        message.error(errorMessage);
      }
    }
  };

  const handleCloseModal = () => {
    setIsAddEventModalVisible(false);
  };

  return (
    <div className="flex h-[calc(100vh-112px)] ml-[250px] mt-[80px]">
      <div className="flex-1 bg-white p-6">
        {renderHeader()}
        <div className="calendar-container">
          <AntCalendar
            locale={viLocale}
            fullscreen={true}
            cellRender={customCellRender}
            onSelect={handleDateSelect}
            headerRender={() => null}
            className="custom-calendar"
            value={currentDate}
            mode={calendarMode}
            onChange={(date) => {
              setCurrentDate(date);
              handleDateSelect(date);
            }}
            onPanelChange={(date, mode) => {
              setCurrentDate(date);
              setCalendarMode(mode);
            }}
          />
        </div>

        <AddEventModal
          visible={isAddEventModalVisible}
          onClose={handleCloseModal}
          onSave={handleAddEvent}
          selectedDate={selectedDate}
        />

        <style>{`
          .custom-calendar .ant-picker-calendar-date-content {
            height: 80px;
            overflow: hidden;
          }
          .custom-calendar .ant-picker-calendar-date {
            margin: 0;
            padding: 4px 8px;
          }
          .custom-calendar .ant-picker-cell {
            background: white;
            border: 1px solid #f0f0f0;
          }
          .custom-calendar .ant-picker-calendar-header {
            display: none;
          }
        `}</style>
      </div>

      {selectedDate && (
        <div className="w-[400px] bg-white border-l border-gray-200 overflow-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                {selectedDate.format('DD/MM/YYYY')}
              </h3>
              <Button 
                type="text" 
                icon={<CloseOutlined />} 
                onClick={() => setSelectedDate(null)} 
              />
            </div>
          </div>

          <div className="p-4">
            {selectedDateEvents.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                Không có lịch trong ngày này
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event, index) => (
                  <div 
                    key={event._id || index}
                    className="p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      backgroundColor: event.eventType === 'offline' ? '#E8EAFF' : '#EEF8C1',
                    }}
                    onClick={() => handleViewEventDetail(event._id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium" style={{
                        color: event.eventType === 'offline' ? '#7B61FF' : '#000'
                      }}>
                        {event.title}
                      </h4>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Thời gian: {dayjs(event.startTime).format('HH:mm')} - {dayjs(event.endTime).format('HH:mm')}</p>
                      <p>Hình thức: {event.eventType === 'offline' ? 'Offline' : 'Online'}</p>
                      {event.location && <p>Địa điểm: {event.location}</p>}
                      {event.description && <p>Mô tả: {event.description}</p>}
                      {event.candidate && (
                        <div>
                          <p className="font-medium">Ứng viên:</p>
                          <p>Tên: {event.candidate.name}</p>
                          <p>Vị trí: {event.candidate.position}</p>
                        </div>
                      )}
                      {event.attendees && event.attendees.length > 0 && (
                        <div>
                          <p className="font-medium">Người tham gia:</p>
                          <ul className="list-disc list-inside">
                            {event.attendees.map((attendee, idx) => (
                              <li key={idx}>{attendee.username}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar; 