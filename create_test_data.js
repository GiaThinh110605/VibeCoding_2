const pool = require('./config/database');

async function createTestData() {
  try {
    console.log('🔧 Creating test data...');

    // Create test book
    await pool.query(
      'INSERT INTO book_titles (title_id, title_name, publisher, author, major_id, total_copies, available_copies) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      ['TEST001', 'Test Book', 'Test Publisher', 'Test Author', 'CNTT', 2, 2]
    );

    // Create test copies
    await pool.query('INSERT INTO book_copies (copy_id, title_id, status, entry_date) VALUES ($1, $2, $3, $4)',
      ['TEST00101', 'TEST001', 'available', new Date().toISOString().split('T')[0]]);
    await pool.query('INSERT INTO book_copies (copy_id, title_id, status, entry_date) VALUES ($1, $2, $3, $4)',
      ['TEST00102', 'TEST001', 'available', new Date().toISOString().split('T')[0]]);

    // Check results
    const result = await pool.query('SELECT copy_id, title_id, status FROM book_copies');
    console.log('✅ Test data created:');
    result.rows.forEach(row => console.log(`- ${row.copy_id} (Book: ${row.title_id}) - Status: ${row.status}`));

    console.log('\n🎯 You can now test:');
    console.log('- Borrow book: TEST00101 or TEST00102');
    console.log('- Return book: (after borrowing)');

    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

createTestData();
