import pytest
import mysql.connector
import os
from mysql.connector import Error

class TestDatabaseConnection:
    """Test suite for database connectivity and schema"""
    
    @pytest.fixture(scope="class")
    def db_connection(self):
        """Setup database connection for tests"""
        connection = None
        try:
            connection = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'library_management')
            )
            if connection.is_connected():
                yield connection
        except Error as e:
            pytest.skip(f"Database connection failed: {e}")
        finally:
            if connection and connection.is_connected():
                connection.close()
    
    def test_database_connection(self, db_connection):
        """Test that database connection is successful"""
        assert db_connection.is_connected()
    
    def test_users_table_exists(self, db_connection):
        """Test that users table exists and has correct structure"""
        cursor = db_connection.cursor()
        
        # Check table exists
        cursor.execute("SHOW TABLES LIKE 'users'")
        result = cursor.fetchone()
        assert result is not None
        
        # Check table structure
        cursor.execute("DESCRIBE users")
        columns = [row[0] for row in cursor.fetchall()]
        
        expected_columns = [
            'user_id', 'username', 'password_hash', 'full_name',
            'email', 'phone', 'role', 'status', 'created_at', 'updated_at'
        ]
        
        for col in expected_columns:
            assert col in columns
    
    def test_readers_table_exists(self, db_connection):
        """Test that readers table exists"""
        cursor = db_connection.cursor()
        
        cursor.execute("SHOW TABLES LIKE 'readers'")
        result = cursor.fetchone()
        assert result is not None
    
    def test_book_titles_table_exists(self, db_connection):
        """Test that book_titles table exists"""
        cursor = db_connection.cursor()
        
        cursor.execute("SHOW TABLES LIKE 'book_titles'")
        result = cursor.fetchone()
        assert result is not None
    
    def test_book_copies_table_exists(self, db_connection):
        """Test that book_copies table exists"""
        cursor = db_connection.cursor()
        
        cursor.execute("SHOW TABLES LIKE 'book_copies'")
        result = cursor.fetchone()
        assert result is not None
    
    def test_borrowing_transactions_table_exists(self, db_connection):
        """Test that borrowing_transactions table exists"""
        cursor = db_connection.cursor()
        
        cursor.execute("SHOW TABLES LIKE 'borrowing_transactions'")
        result = cursor.fetchone()
        assert result is not None
    
    def test_majors_table_exists(self, db_connection):
        """Test that majors table exists"""
        cursor = db_connection.cursor()
        
        cursor.execute("SHOW TABLES LIKE 'majors'")
        result = cursor.fetchone()
        assert result is not None
    
    def test_default_admin_user_exists(self, db_connection):
        """Test that default admin user exists"""
        cursor = db_connection.cursor()
        
        cursor.execute("SELECT * FROM users WHERE username = 'admin'")
        result = cursor.fetchone()
        
        assert result is not None
        assert result[1] == 'admin'  # username
        assert result[6] == 'admin'  # role
    
    def test_sample_majors_exist(self, db_connection):
        """Test that sample majors were inserted"""
        cursor = db_connection.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM majors")
        count = cursor.fetchone()[0]
        
        assert count >= 4  # Should have at least 4 sample majors
    
    def test_foreign_key_constraints(self, db_connection):
        """Test that foreign key constraints are properly set up"""
        cursor = db_connection.cursor()
        
        # Check book_copies foreign key
        cursor.execute("""
            SELECT REFERENCED_TABLE_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'book_copies' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        """)
        
        result = cursor.fetchone()
        assert result is not None
        assert result[0] == 'book_titles'

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
