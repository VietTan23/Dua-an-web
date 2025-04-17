import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import laptopImg from '../../assets/login/laptop.png';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
  
    try {
      const response = await fetch('https://backendhr-9ti5.onrender.com/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log('User data from server:', data.user);
        // Lưu token và thông tin user
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Tất cả role đều về dashboard
        navigate('/dashboard');
      } else {
        setErrorMessage(data.message || 'Đăng nhập không thành công');
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
      setErrorMessage('Lỗi kết nối đến server');
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

      {/* Form đăng nhập */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 px-4 lg:pl-[10%]">
        {/* Tiêu đề */}
        <h2 className="text-center font-bold text-[16px] leading-[19px] text-[#1A1A1A] mb-5">Chào bạn!</h2>
        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="mb-4 w-full max-w-[367px] bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col items-center w-full max-w-[367px]">
          {/* Tên đăng nhập */}
          <div className="w-full mb-4">
            <label className="block text-[16px] text-[#000] mb-1">Tên đăng nhập:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-[34px] border border-[#656ED3] rounded-full px-4 focus:outline-none"
            />
          </div>

          {/* Mật khẩu */}
          <div className="w-full mb-4 relative">
            <label className="block text-[16px] text-[#000] mb-1">Mật khẩu:</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[34px] border border-[#656ED3] rounded-full px-4 pr-10 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-transparent border-none p-0"
              >
                {showPassword ? <AiOutlineEyeInvisible size={16} /> : <AiOutlineEye size={16} />}
              </button>
            </div>
          </div>

          {/* Ghi nhớ tài khoản và Quên mật khẩu */}
          <div className="flex items-center justify-between w-full mb-4">
            {/* Switcher */}
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <div className="w-10 h-5 bg-[#F2F2F2] rounded-full peer-checked:bg-[#656ED3] after:content-[''] after:absolute after:w-5 after:h-5 after:bg-white after:rounded-full after:top-0 after:left-0 after:shadow-md peer-checked:after:translate-x-5 after:transition"></div>
              </label>
              <span className="ml-2 text-[12px] text-[#1A1A1A]">Lưu tài khoản</span>
            </div>

            <a href="/forgot-password" className="text-[12px] text-[#007AFF]">Quên mật khẩu?</a>
          </div>

          {/* Nút đăng nhập */}
          <button
            type="submit"
            className="w-full h-[35px] bg-[#656ED3] rounded-full text-white font-medium text-[16px] hover:bg-[#4d4dbf] transition flex items-center justify-center"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
