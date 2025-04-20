import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import laptopImg from '../../assets/login/laptop.png';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import axios from 'axios';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords
    if (passwords.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('https://backendhr-9ti5.onrender.com/api/users/reset-password', {
        token,
        newPassword: passwords.newPassword
      });

      setSuccess('Đặt lại mật khẩu thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#EBEFFF] flex relative">
      {/* Phần màu tím bên phải */}
      <div className="absolute right-0 top-0 w-[35%] h-full bg-[#AFB3FF]"></div>

      {/* Hình minh họa */}
      <div className="absolute right-[10%] top-[5%] w-[45%] h-[80%] hidden lg:block">
        <img src={laptopImg} alt="Illustration" className="w-full h-full object-contain" />
      </div>

      {/* Form đặt lại mật khẩu */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 px-4 lg:pl-[10%]">
        {/* Tiêu đề */}
        <h2 className="text-center font-bold text-[16px] leading-[19px] text-[#1A1A1A] mb-5">
          Đặt lại mật khẩu
        </h2>

        {/* Thông báo */}
        {error && (
          <div className="mb-4 w-full max-w-[367px] bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 w-full max-w-[367px] bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-md">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full max-w-[367px]">
          {/* Mật khẩu mới */}
          <div className="w-full mb-4 relative">
            <label className="block text-[16px] text-[#000] mb-1">Mật khẩu mới:</label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                name="newPassword"
                value={passwords.newPassword}
                onChange={handleChange}
                className="w-full h-[34px] border border-[#656ED3] rounded-full px-4 pr-10 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-transparent border-none p-0"
              >
                {showPassword.new ? <AiOutlineEyeInvisible size={16} /> : <AiOutlineEye size={16} />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu */}
          <div className="w-full mb-6 relative">
            <label className="block text-[16px] text-[#000] mb-1">Xác nhận mật khẩu:</label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handleChange}
                className="w-full h-[34px] border border-[#656ED3] rounded-full px-4 pr-10 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-transparent border-none p-0"
              >
                {showPassword.confirm ? <AiOutlineEyeInvisible size={16} /> : <AiOutlineEye size={16} />}
              </button>
            </div>
          </div>

          {/* Nút đặt lại mật khẩu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[35px] bg-[#656ED3] rounded-full text-white font-medium text-[16px] hover:bg-[#4d4dbf] transition flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Đặt lại mật khẩu'
            )}
          </button>

          {/* Link quay lại đăng nhập */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-4 text-[#656ED3] hover:text-[#4d4dbf] transition"
          >
            Quay lại đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
