import React, { useState, useEffect } from "react";
import {
  Modal,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Checkbox,
  Form,
  message,
  InputNumber,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import locale from "antd/es/date-picker/locale/vi_VN";
import dayjs from "dayjs";
import axios from "axios";

const { TextArea } = Input;
const { Option } = Select;

const AddEventModal = ({
  visible,
  onClose,
  onSave,
  selectedDate,
  candidateId,
  existingEvent,
  isEventUpdate,
  onUpdate,
  onDelete
}) => {
  const [form] = Form.useForm();
  const [candidates, setCandidates] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (existingEvent && isEventUpdate) {
        // Nếu là chỉnh sửa, set các giá trị từ existingEvent
        const localStartTime = dayjs(existingEvent.startTime);
        form.setFieldsValue({
          title: existingEvent.title,
          date: localStartTime,
          startTime: localStartTime,
          endTime: dayjs(existingEvent.endTime),
          eventType: existingEvent.eventType,
          room: existingEvent.room??"room1",
          location: existingEvent.location,
          type: existingEvent.type,
          beforeEvent: existingEvent.beforeEvent || 5,
          assignTo: candidateId,
          attendees: existingEvent.attendees.map((attendee) => attendee._id),
          description: existingEvent.description,
        });
      } else {
        // Nếu là tạo mới, set các giá trị mặc định
        form.setFieldsValue({
          date: selectedDate ? dayjs(selectedDate) : dayjs(),
          startTime: dayjs("14:00", "HH:mm"),
          endTime: dayjs("14:30", "HH:mm"),
          eventType: "offline",
          room: "room1",
          beforeEvent: 5,
          type: "interview",
        });
      }
      fetchData();
    }
  }, [visible, selectedDate, form, candidateId, existingEvent, isEventUpdate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        message.error("Vui lòng đăng nhập lại");
        return;
      }

      // Fetch candidates for calendar
      try {
        const candidatesResponse = await axios.get(
          "https://backendhr-9ti5.onrender.com/api/candidates/calendar/candidates",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (
          candidatesResponse.data &&
          Array.isArray(candidatesResponse.data.candidates)
        ) {
          const availableCandidates = candidatesResponse.data.candidates.filter(
            (candidate) =>
              candidate &&
              candidate._id &&
              candidate.name &&
              candidate.stage &&
              ["interview1", "interview2"].includes(candidate.stage)
          );
          setCandidates(availableCandidates);
        } else {
          console.error(
            "Candidates data is not an array:",
            candidatesResponse.data
          );
          message.error("Dữ liệu ứng viên không đúng định dạng");
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
        message.error("Không thể tải danh sách ứng viên");
      }

      // Fetch users
      try {
        const usersResponse = await axios.get(
          "https://backendhr-9ti5.onrender.com/api/users/all",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (usersResponse.data && Array.isArray(usersResponse.data)) {
          const validUsers = usersResponse.data.filter(
            (user) => user && user._id && user.username && user.email
          );
          setUsers(validUsers);
        } else {
          console.error("Users data is not an array:", usersResponse.data);
          message.error("Dữ liệu người dùng không đúng định dạng");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        message.error("Không thể tải danh sách người dùng");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await onUpdate(values);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleDelete = async () => {
    try {

      await onDelete();
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <Modal
      title={existingEvent ? "Chỉnh sửa lịch phỏng vấn" : "Thêm lịch phỏng vấn"}
      open={visible}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            form.resetFields();
            onClose();
          }}
        >
          Hủy
        </Button>,
        <Button
          key="save"
          type="primary"
          onClick={isEventUpdate ? handleUpdate : handleSave}
          className="bg-[#656ED3]"
          loading={loading}
        >
          {existingEvent && isEventUpdate ? "Cập nhật" : "Lưu"}
        </Button>,
      
      ...(isEventUpdate
        ? [
            <Button
              key="delete"
              type="primary"
              danger
              onClick={handleDelete}
              className="bg-red-500"
            >
              Xóa
            </Button>,
          ]
        : []),
      ]}
      width={800}
      className="add-event-modal"
    >
      <Form form={form} layout="vertical">
        <div className="grid grid-cols-3 gap-4">
          {/* Cột 1 */}
          <div className="col-span-1 space-y-4">
            <Form.Item
              label="Phòng họp"
              name="room"
              rules={[{ required: true, message: "Vui lòng chọn phòng họp" ,}]}
            >
              <Select placeholder="Chọn phòng họp">
                <Option value="room1">Phòng họp 1</Option>
              </Select>
            </Form.Item>

            <Form.Item name="location" label="Địa điểm">
              <Input placeholder="Nhập địa điểm" />
            </Form.Item>

            <Form.Item
              label="Loại cuộc họp"
              name="type"
              rules={[
                { required: true, message: "Vui lòng chọn loại cuộc họp" },
              ]}
            >
              <Select placeholder="Chọn loại cuộc họp">
                <Option value="interview">Phỏng vấn</Option>
                {/* <Option value="meeting">Họp nội bộ</Option>
                <Option value="presentation">Thuyết trình</Option> */}
              </Select>
            </Form.Item>

            <Form.Item name="eventType" label="Hình thức">
              <Select>
                <Option value="offline">
                  <span className="text-blue-600">Offline</span>
                </Option>
                <Option value="online">
                  <span className="text-green-600">Online</span>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item name="beforeEvent" label="Thời gian báo trước">
              <InputNumber
                min={1}
                placeholder="Nhập số phút"
                className="w-full"
                addonAfter="phút"
              />
            </Form.Item>
          </div>

          {/* Cột 2 & 3 */}
          <div className="col-span-2 space-y-4">
            <Form.Item
              name="title"
              label="Tiêu đề"
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
            >
              <Input />
            </Form.Item>

            <div className="flex gap-4">
              <Form.Item
                name="date"
                label="Ngày"
                className="flex-1"
                rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
              >
                <DatePicker locale={locale} className="w-full" />
              </Form.Item>

              <Form.Item
                name="startTime"
                label="Thời gian bắt đầu"
                className="flex-1"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời gian bắt đầu",
                  },
                ]}
              >
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>

              <Form.Item
                name="endTime"
                label="Thời gian kết thúc"
                className="flex-1"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng chọn thời gian kết thúc",
                  },
                ]}
              >
                <TimePicker format="HH:mm" className="w-full" />
              </Form.Item>
            </div>

            <Form.Item name="assignTo" label="Chọn ứng viên" rules={[
                  { required: true, message: "Vui lòng chọn ứng viên" },
                ]}>
              <Select
                showSearch
                placeholder="Chọn ứng viên"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children
                    ?.toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
                loading={loading}
                disabled={!!candidateId&&isEventUpdate}
                
              >
                {candidates && candidates.length > 0 ? (
                  candidates.map(
                    (candidate) =>
                      candidate &&
                      candidate._id && (
                        <Option key={candidate._id} value={candidate._id}>
                          {candidate.name} ({candidate.email})
                        </Option>
                      )
                  )
                ) : (
                  <Option value="no-candidates" disabled>
                    Không có ứng viên phù hợp
                  </Option>
                )}
              </Select>
            </Form.Item>

            <Form.Item
              label="Người tham dự"
              name="attendees"
              rules={[
                { required: true, message: "Vui lòng chọn người tham dự" },
              ]}
            >
              <Select
                mode="multiple"
                placeholder="Chọn người tham dự"
                loading={loading}
              >
                {users.map((user) => (
                  <Option key={user._id} value={user._id}>
                    {user.fullName} ({user.email})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Mô tả" name="description">
              <TextArea
                rows={6}
                placeholder="Nhập mô tả chi tiết về cuộc họp"
                style={{ resize: "none" }}
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Modal>
  );
};

export default AddEventModal;