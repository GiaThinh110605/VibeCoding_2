import pytest
import requests
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class TestLibraryAPI:
    """Test suite for Library Management System API"""
    
    BASE_URL = "http://localhost:3000"
    
    def setup_method(self):
        """Setup before each test"""
        # Ensure server is running
        try:
            response = requests.get(f"{self.BASE_URL}/")
            if response.status_code != 200:
                raise Exception("Server not running")
        except requests.exceptions.ConnectionError:
            raise Exception("Server not accessible. Start the server with 'npm run dev'")
    
    def test_login_page_loads(self):
        """Test that login page loads correctly"""
        response = requests.get(f"{self.BASE_URL}/")
        assert response.status_code == 200
        assert "Đăng nhập" in response.text
    
    def test_login_with_valid_credentials(self):
        """Test login with valid admin credentials"""
        session = requests.Session()
        
        # Get login page first to get session
        session.get(f"{self.BASE_URL}/")
        
        # Login with credentials
        login_data = {
            'username': 'admin',
            'password': 'admin123'
        }
        
        response = session.post(f"{self.BASE_URL}/login", data=login_data)
        
        # Should redirect to dashboard
        assert response.status_code == 302
        assert 'dashboard' in response.headers.get('location', '')
    
    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials"""
        session = requests.Session()
        
        # Get login page first
        session.get(f"{self.BASE_URL}/")
        
        # Login with wrong credentials
        login_data = {
            'username': 'invalid',
            'password': 'wrongpassword'
        }
        
        response = session.post(f"{self.BASE_URL}/login", data=login_data)
        
        # Should redirect back to login with error
        assert response.status_code == 302
        assert 'error' in response.headers.get('location', '')
    
    def test_protected_routes_require_auth(self):
        """Test that protected routes redirect to login when not authenticated"""
        protected_routes = [
            '/dashboard',
            '/staff',
            '/readers',
            '/books'
        ]
        
        for route in protected_routes:
            response = requests.get(f"{self.BASE_URL}{route}")
            assert response.status_code == 302
            assert response.headers.get('location', '').endswith('/')
    
    def test_staff_management_pages(self):
        """Test staff management pages are accessible with proper authentication"""
        session = self._authenticate_admin()
        
        # Test staff list page
        response = session.get(f"{self.BASE_URL}/staff")
        assert response.status_code == 200
        assert "Quản lý nhân viên" in response.text
        
        # Test add staff page
        response = session.get(f"{self.BASE_URL}/staff/add")
        assert response.status_code == 200
        assert "Thêm nhân viên mới" in response.text
    
    def test_add_staff_member(self):
        """Test adding a new staff member"""
        session = self._authenticate_admin()
        
        # Get add staff page
        session.get(f"{self.BASE_URL}/staff/add")
        
        # Submit new staff form
        staff_data = {
            'username': 'teststaff',
            'password': 'testpass123',
            'full_name': 'Test Staff Member',
            'email': 'teststaff@library.com',
            'phone': '0912345678',
            'role': 'librarian'
        }
        
        response = session.post(f"{self.BASE_URL}/staff/add", data=staff_data)
        
        # Should redirect back to staff list with success message
        assert response.status_code == 302
        assert 'success' in response.headers.get('location', '')
    
    def test_dashboard_loads_with_auth(self):
        """Test dashboard loads correctly when authenticated"""
        session = self._authenticate_admin()
        
        response = session.get(f"{self.BASE_URL}/dashboard")
        
        assert response.status_code == 200
        assert "Bảng điều khiển" in response.text
    
    def _authenticate_admin(self):
        """Helper method to authenticate as admin"""
        session = requests.Session()
        
        # Get login page
        session.get(f"{self.BASE_URL}/")
        
        # Login
        login_data = {
            'username': 'admin',
            'password': 'admin123'
        }
        
        session.post(f"{self.BASE_URL}/login", data=login_data)
        
        return session

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
