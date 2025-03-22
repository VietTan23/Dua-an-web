import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import registerImg from '../../assets/login/register.png';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import axios from 'axios';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    department: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { id: 'department_head', name: 'Trưởng phòng ban' },
    { id: 'business_director', name: 'Giám đốc kinh doanh' },
    { id: 'ceo', name: 'CEO (Giám đốc điều hành)' },
    { id: 'recruitment', name: 'Bộ phận tuyển dụng' },
    { id: 'applicant', name: 'Ứng viên' },
    { id: 'director', name: 'Giám đốc' }
  ];

  const departments = [
    { id: 'accounting', name: 'Kế toán' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'it', name: 'IT' },
    { id: 'hr', name: 'Nhân sự' },
    { id: 'sales', name: 'Kinh doanh' }
  ];

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên';
    }

    if (!formData.username.trim()) {
      errors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (formData.username.length < 6) {
      errors.username = 'Tên đăng nhập phải có ít nhất 6 ký tự';
    }

    if (!formData.email.trim()) {
      errors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!formData.role) {
      errors.role = 'Vui lòng chọn vai trò';
    }

    if (formData.role === 'department_head' && !formData.department) {
      errors.department = 'Vui lòng chọn phòng ban';
    }

    if (!formData.password) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu không khớp';
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset department when role changes
      ...(name === 'role' && value !== 'department_head' ? { department: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/users/register', {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department
      });

      setSuccess('Đăng ký thành công! Đang chuyển hướng...');
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      setFormData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        department: ''
      });

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#EBEFFF] flex font-inter">
      {/* Phần hình ảnh bên trái */}
      <div className="w-1/2 relative">
        <div className="absolute top-0 left-24 w-full h-[80vh]">
          <img src={registerImg} alt="Register Illustration" className="w-full h-full object-contain object-top" />
        </div>
      </div>

      {/* Form bên phải */}
      <div className="w-1/2 flex flex-col items-center justify-center px-16">
        <div className="w-full max-w-[400px]">
          {/* Tiêu đề */}
          <h2 className="text-center font-bold text-2xl text-[#1A1A1A] mb-8">Đăng ký tài khoản!</h2>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {success && <p className="text-green-500 text-center mb-4">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Họ và tên */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full h-[40px] border border-[#656ED3] rounded-[25px] px-4 focus:outline-none bg-transparent"
                placeholder="Nhập họ và tên"
              />
            </div>

            {/* Tên đăng nhập */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full h-[40px] border border-[#656ED3] rounded-[25px] px-4 focus:outline-none bg-transparent"
                placeholder="Nhập tên đăng nhập"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-[40px] border border-[#656ED3] rounded-[25px] px-4 focus:outline-none bg-transparent"
                placeholder="Nhập email"
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Vai trò <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                {roles.map(role => (
                  <label key={role.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="role"
                      value={role.id}
                      checked={formData.role === role.id}
                      onChange={handleChange}
                      className="text-[#656ED3] focus:ring-[#656ED3]"
                    />
                    <span className="text-sm">{role.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Department Selection - Only show when Trưởng phòng ban is selected */}
            {formData.role === 'department_head' && (
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  Phòng ban <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {departments.map(dept => (
                    <label key={dept.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="department"
                        value={dept.id}
                        checked={formData.department === dept.id}
                        onChange={handleChange}
                        className="text-[#656ED3] focus:ring-[#656ED3]"
                      />
                      <span className="text-sm">{dept.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Mật khẩu mới */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-[40px] border border-[#656ED3] rounded-[25px] px-4 pr-10 focus:outline-none bg-transparent"
                  placeholder="Nhập mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-transparent border-none p-0"
                >
                  {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full h-[40px] border border-[#656ED3] rounded-[25px] px-4 pr-10 focus:outline-none bg-transparent"
                  placeholder="Xác nhận mật khẩu mới"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-transparent border-none p-0"
                >
                  {showConfirmPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
                </button>
              </div>
            </div>

            {/* Nút đăng ký */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-[40px] ${loading ? 'bg-[#9B9B9B] cursor-not-allowed' : 'bg-[#656ED3] hover:bg-[#4d4dbf]'} text-white font-medium text-base rounded-[25px] transition mt-8 flex items-center justify-center`}
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </button>

            {/* Link đăng nhập */}
            <p className="text-center text-sm mt-4">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#656ED3] hover:underline"
              >
                Đăng nhập
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
