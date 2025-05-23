import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, message, Spin } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import CalendarSidebar from '../components/Calendar/CalendarSidebar';
import Sidebar from '../components/Sidebar/Sidebar';
import AddEventModal from '../components/Calendar/AddEventModal';

// Cấu hình locale cho dayjs
dayjs.locale('vi');

// Tùy chỉnh locale cho calendar
const customLocale = {
  shortWeekDays: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  weekDays: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
};

const EventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedView, setSelectedView] = useState('Tuần');
  const [isAddEventModalVisible, setIsAddEventModalVisible] = useState(false);

  useEffect(() => {
    if (!eventId) {
      message.error('ID sự kiện không hợp lệ');
      navigate('/calendar');
      return;
    }

    if (dayjs(eventId, 'YYYY-MM-DD', true).isValid()) {
      setSelectedDate(dayjs(eventId));
      setLoading(false);
    } else {
      fetchEventDetail();
    }
    fetchAllEvents();
  }, [eventId, navigate]);

  const fetchEventDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:8000/api/interviews/${eventId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data) {
        setEvent(response.data);
        if (response.data.date) {
          setSelectedDate(dayjs(response.data.date));
        }
      }
    } catch (error) {
      console.error('Error fetching event detail:', error);
      if (error.response?.status === 404) {
        message.error('Không tìm thấy sự kiện này');
        setTimeout(() => navigate('/calendar'), 2000);
      } else if (error.response?.status === 401) {
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
        navigate('/login');
      } else {
        message.error('Không thể tải thông tin chi tiết lịch');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Vui lòng đăng nhập lại');
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:8000/api/interviews', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      if (error.response?.status === 401) {
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
        navigate('/login');
      } else {
        message.error('Không thể tải danh sách lịch');
      }
    }
  };

  const timeSlots = Array.from({ length: 10 }, (_, i) => {
    const hour = i + 9;
    return `${hour}:00`;
  });

  const getEventsForDay = (date) => {
    return events.filter(evt => 
      dayjs(evt.date).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
    );
  };

  const getDaysInWeek = () => {
    // Bắt đầu từ Thứ 2 (1) thay vì Chủ nhật (0)
    const startOfWeek = selectedDate.startOf('week').add(1, 'day');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
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

      const response = await axios.post('http://localhost:8000/api/interviews', formattedData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 201 || response.status === 200) {
        message.success('Thêm sự kiện thành công');
        setIsAddEventModalVisible(false);
        fetchAllEvents();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 ml-[250px]">
        <div className="flex h-[calc(100vh-64px)] mt-[64px]">
          {/* Calendar Sidebar */}
          <div className="w-[250px] bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              {/* Mini Calendar */}
              <div className="mb-8">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-medium">
                      Tháng {selectedDate.format('M')}, {selectedDate.format('YYYY')}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => setSelectedDate(prev => prev.subtract(1, 'month'))}
                      >
                        &lt;
                      </button>
                      <button 
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => setSelectedDate(prev => prev.add(1, 'month'))}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    <div className="text-center text-xs text-gray-500">T2</div>
                    <div className="text-center text-xs text-gray-500">T3</div>
                    <div className="text-center text-xs text-gray-500">T4</div>
                    <div className="text-center text-xs text-gray-500">T5</div>
                    <div className="text-center text-xs text-gray-500">T6</div>
                    <div className="text-center text-xs text-gray-500">T7</div>
                    <div className="text-center text-xs text-gray-500">CN</div>
                    {Array.from({ length: 42 }, (_, i) => {
                      const currentDate = selectedDate.startOf('month').startOf('week').add(1, 'day').add(i, 'day');
                      const isCurrentMonth = currentDate.month() === selectedDate.month();
                      const isToday = currentDate.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
                      const isSelected = currentDate.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD');
                      
                      return (
                        <div 
                          key={i} 
                          className={`text-center text-sm p-1 rounded-full ${
                            !isCurrentMonth ? 'text-gray-300' :
                            isSelected ? 'bg-[#7B61FF] text-white' :
                            isToday ? 'bg-gray-100 font-bold' :
                            'hover:bg-gray-100 cursor-pointer'
                          }`}
                          onClick={() => setSelectedDate(currentDate)}
                        >
                          {currentDate.format('D')}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm lịch hẹn"
                    className="w-full px-3 py-2 border rounded-lg pl-8"
                  />
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 14L11 11" stroke="#667085" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Quản lý */}
              <div className="mb-8">
                <h3 className="text-sm font-medium mb-2">Quản lý</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F4F1FE] text-[#7B61FF]">
                    <div className="w-2 h-2 rounded-full bg-[#7B61FF]"></div>
                    <span>Duyên DTM</span>
                  </div>
                </div>
              </div>

              {/* Đang theo dõi */}
              <div>
                <h3 className="text-sm font-medium mb-2">Đang theo dõi</h3>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>Nguyễn Hương Giang</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Nguyễn Viết Lâm</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Nguyễn Duy Quang</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Calendar Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate('/calendar')}
                >
                  Quay lại
                </Button>
                <h1 className="text-2xl font-semibold">
                  {event ? event.title : `Tháng ${selectedDate.format('M')}, ${selectedDate.format('YYYY')}`}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <Button onClick={() => setSelectedDate(prev => prev.subtract(1, 'week'))}>
                    &lt;
                  </Button>
                  <Button onClick={() => setSelectedDate(prev => prev.add(1, 'week'))}>
                    &gt;
                  </Button>
                </div>
                <div className="flex border rounded-lg overflow-hidden">
                  <button 
                    className={`px-4 py-1 ${selectedView === 'Ngày' ? 'bg-[#7B61FF] text-white' : 'bg-white'}`}
                    onClick={() => setSelectedView('Ngày')}
                  >
                    Ngày
                  </button>
                  <button 
                    className={`px-4 py-1 ${selectedView === 'Tuần' ? 'bg-[#E7FE50] text-black' : 'bg-white'}`}
                    onClick={() => setSelectedView('Tuần')}
                  >
                    Tuần
                  </button>
                  <button 
                    className={`px-4 py-1 ${selectedView === 'Tháng' ? 'bg-[#7B61FF] text-white' : 'bg-white'}`}
                    onClick={() => setSelectedView('Tháng')}
                  >
                    Tháng
                  </button>
                </div>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  className="bg-[#7B61FF] text-white hover:bg-[#6B51EF] flex items-center gap-2 h-[40px] px-4"
                  onClick={() => setIsAddEventModalVisible(true)}
                >
                  <span className="text-white">Tạo lịch</span>
                </Button>
              </div>
            </div>

            <div className="bg-white h-[calc(100vh-200px)] overflow-y-auto">
              {/* Header */}
              <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
                <div className="p-4 border-r"></div>
                {getDaysInWeek().map((date, index) => (
                  <div 
                    key={index}
                    className={`p-4 text-center border-r ${
                      date.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD') 
                        ? 'bg-[#F4F1FE]' 
                        : date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
                          ? 'bg-gray-100'
                          : ''
                    }`}
                  >
                    <div className="font-medium">
                      {customLocale.shortWeekDays[index]}
                    </div>
                    <div className="text-lg">{date.format('D')}</div>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              <div className="relative">
                {timeSlots.map((time, index) => (
                  <div key={index} className="grid grid-cols-8 border-b" style={{ height: '60px' }}>
                    <div className="p-2 border-r text-sm text-gray-500 sticky left-0 bg-white">{time}</div>
                    {getDaysInWeek().map((date, dayIndex) => {
                      const dayEvents = getEventsForDay(date);
                      return (
                        <div 
                          key={dayIndex}
                          className={`border-r relative ${
                            date.format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD')
                              ? 'bg-[#F4F1FE]'
                              : date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
                                ? 'bg-gray-100'
                                : ''
                          }`}
                        >
                          {dayEvents.map((event, eventIndex) => {
                            const startTime = dayjs(event.startTime);
                            if (startTime.format('HH') === time.split(':')[0]) {
                              return (
                                <div
                                  key={eventIndex}
                                  className="absolute left-0 right-0 mx-1 p-1 bg-[#E7F6EC] text-[#12B76A] text-xs rounded"
                                  style={{
                                    top: '0',
                                    zIndex: 10
                                  }}
                                  onClick={() => navigate(`/calendar/event/${event._id}`)}
                                >
                                  {event.title}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddEventModal
        visible={isAddEventModalVisible}
        onClose={handleCloseModal}
        onSave={handleAddEvent}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default EventDetail; 