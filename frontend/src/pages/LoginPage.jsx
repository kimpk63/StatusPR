import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(formData.name, formData.email, formData.password, formData.role);
      } else {
        await login(formData.email, formData.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 p-8 rounded-lg w-96">
        <h1 className="text-2xl font-bold text-white mb-6">
          {isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-slate-300 mb-2">ชื่อ</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 mb-2">อีเมล</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-2">รหัสผ่าน</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white"
              required
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-slate-300 mb-2">บทบาท</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white"
              >
                <option value="employee">พนักงาน</option>
                <option value="manager">หัวหน้างาน</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded"
          >
            {loading ? 'กำลังส่ง...' : isRegister ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-400 hover:underline"
          >
            {isRegister ? 'มีบัญชีแล้ว? เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </div>
      </div>
    </div>
  );
}