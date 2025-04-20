import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import registerImg from '../../assets/login/register.png';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import axios from 'axios';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập mã xác nhận và mật khẩu mới

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (step === 1) {
      if (!formData.email.trim()) {
        errors.email = 'Vui lòng nhập email';
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Email không hợp lệ';
      }
    } else {
      if (!formData.verificationCode.trim()) {
        errors.verificationCode = 'Vui lòng nhập mã xác nhận';
      }
      if (!formData.newPassword) {
        errors.newPassword = 'Vui lòng nhập mật khẩu mới';
      } else if (formData.newPassword.length < 6) {
        errors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      } else if (formData.newPassword !== formData.confirmPassword) {
        errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      if (step === 1) {
        const response = await axios.post('https://backendhr-9ti5.onrender.com/api/users/forgot-password', {
          email: formData.email
        });
        setSuccess('Mã xác nhận đã được gửi đến email của bạn!');
        setStep(2);
      } else {
        const response = await axios.post('https://backendhr-9ti5.onrender.com/api/users/reset-password', {
          email: formData.email,
          verificationCode: formData.verificationCode,
          newPassword: formData.newPassword
        });
        setSuccess('Đặt lại mật khẩu thành công!');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#EBEFFF] flex font-inter">
      {/* Phần hình ảnh bên trái */}
      <div className="w-1/2 relative">
        <div className="absolute top-0 left-24 w-full h-[80vh]">
          <img src={registerImg} alt="Forgot Password Illustration" className="w-full h-full object-contain object-top" />
        </div>
      </div>

      {/* Form bên phải */}
      <div className="w-1/2 flex flex-col items-center justify-center px-16">
        <div className="w-full max-w-[400px]">
          {/* Tiêu đề */}
          <h2 className="text-center font-bold text-2xl text-[#1A1A1A] mb-4">
            {step === 1 ? 'Quên mật khẩu?' : 'Đặt lại mật khẩu'}
          </h2>
          <p className="text-center text-gray-600 mb-8">
            {step === 1 
              ? 'Nhập email của bạn và chúng tôi sẽ gửi mã xác nhận.'
              : 'Nhập mã xác nhận và mật khẩu mới của bạn.'}
          </p>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          {success && <p className="text-green-500 text-center mb-4">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                disabled={step === 2}
                className="w-full h-[40px] border border-[#656ED3] rounded-[25px] px-4 focus:outline-none bg-transparent disabled:bg-gray-100"
                placeholder="Nhập email của bạn"
              />
            </div>

            {step === 2 && (
              <>
                {/* Mã xác nhận */}
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Mã xác nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="verificationCode"
                    value={formData.verificationCode}
                    onChange={handleChange}
                    className="w-full h-[40px] border border-[#656ED3] rounded-[25px] px-4 focus:outline-none bg-transparent"
                    placeholder="Nhập mã xác nhận"
                  />
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="w-full h-[40px] border border-[#656ED3] rounded-[25px] px-4 focus:outline-none bg-transparent"
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>

                {/* Xác nhận mật khẩu */}
                <div>
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full h-[40px] border border-[#656ED3] rounded-[25px] px-4 focus:outline-none bg-transparent"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </>
            )}

            {/* Nút gửi */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[40px] bg-[#656ED3] text-white rounded-[25px] font-medium hover:bg-[#4C54B0] transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                step === 1 ? 'Gửi mã xác nhận' : 'Đặt lại mật khẩu'
              )}
            </button>

            {/* Link quay lại đăng nhập */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#656ED3] hover:text-[#4C54B0] transition-colors"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
