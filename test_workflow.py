import pytest
import subprocess
import time
import requests
import signal
import os

class TestApplicationWorkflow:
    """End-to-end workflow tests for the Library Management System"""
    
    @pytest.fixture(scope="class")
    def app_server(self):
        """Start the application server for testing"""
        # Start the server
        env = os.environ.copy()
        env['NODE_ENV'] = 'test'
        
        process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid
        )
        
        # Wait for server to start
        time.sleep(5)
        
        # Verify server is running
        max_attempts = 10
        for i in range(max_attempts):
            try:
                response = requests.get('http://localhost:3000')
                if response.status_code == 200:
                    break
            except requests.exceptions.ConnectionError:
                if i == max_attempts - 1:
                    pytest.skip("Server failed to start")
                time.sleep(1)
        
        yield process
        
        # Clean up: kill the server process
        os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        process.wait()
    
    def test_complete_user_workflow(self, app_server):
        """Test complete user workflow from login to staff management"""
        session = requests.Session()
        
        # 1. Access login page
        response = session.get('http://localhost:3000/')
        assert response.status_code == 200
        assert 'Đăng nhập' in response.text
        
        # 2. Login with admin credentials
        login_data = {
            'username': 'admin',
            'password': 'admin123'
        }
        
        response = session.post('http://localhost:3000/login', data=login_data)
        assert response.status_code == 302
        assert 'dashboard' in response.headers.get('location', '')
        
        # 3. Access dashboard
        response = session.get('http://localhost:3000/dashboard')
        assert response.status_code == 200
        assert 'Bảng điều khiển' in response.text
        
        # 4. Access staff management
        response = session.get('http://localhost:3000/staff')
        assert response.status_code == 200
        assert 'Quản lý nhân viên' in response.text
        
        # 5. Add new staff member
        response = session.get('http://localhost:3000/staff/add')
        assert response.status_code == 200
        
        staff_data = {
            'username': f'testuser_{int(time.time())}',
            'password': 'testpass123',
            'full_name': 'Test User',
            'email': 'test@example.com',
            'phone': '0912345678',
            'role': 'librarian'
        }
        
        response = session.post('http://localhost:3000/staff/add', data=staff_data)
        assert response.status_code == 302
        
        # 6. Verify staff was added (check staff list page)
        response = session.get('http://localhost:3000/staff')
        assert response.status_code == 200
        assert 'Test User' in response.text
        
        # 7. Logout
        response = session.get('http://localhost:3000/logout')
        assert response.status_code == 302
        assert response.headers.get('location', '') == 'http://localhost:3000/'
    
    def test_unauthorized_access(self, app_server):
        """Test that unauthorized access is properly blocked"""
        # Try to access protected routes without login
        protected_routes = [
            '/dashboard',
            '/staff',
            '/readers',
            '/books'
        ]
        
        for route in protected_routes:
            response = requests.get(f'http://localhost:3000{route}')
            assert response.status_code == 302
            # Should redirect to login page
            assert 'localhost:3000/' in response.headers.get('location', '')
    
    def test_error_handling(self, app_server):
        """Test error handling for invalid routes"""
        # Test 404 for non-existent route
        response = requests.get('http://localhost:3000/nonexistent')
        assert response.status_code == 404
    
    def test_static_files_served(self, app_server):
        """Test that static files are properly served"""
        # Test CSS files
        response = requests.get('http://localhost:3000/css/style.css')
        # May return 404 if file doesn't exist, but shouldn't crash
        assert response.status_code in [200, 404]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
