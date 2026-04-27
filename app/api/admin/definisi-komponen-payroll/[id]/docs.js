/**
 * @swagger
 * /api/admin/definisi-komponen-payroll/{id}:
 *   get:
 *     summary: Detail definisi komponen payroll
 *     description: Mengambil detail satu definisi komponen payroll berdasarkan ID.
 *     tags: [Admin - Definisi Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID definisi komponen payroll.
 *     responses:
 *       '200':
 *         description: Detail definisi komponen payroll ditemukan.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Definisi komponen payroll tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui definisi komponen payroll
 *     description: Memperbarui field definisi komponen payroll berdasarkan ID.
 *     tags: [Admin - Definisi Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID definisi komponen payroll.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_tipe_komponen_payroll:
 *                 type: string
 *                 maxLength: 36
 *               nama_komponen:
 *                 type: string
 *                 maxLength: 255
 *               arah_komponen:
 *                 type: string
 *                 enum: [PEMASUKAN, POTONGAN]
 *               berulang_default:
 *                 type: boolean
 *               aktif:
 *                 type: boolean
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Definisi komponen payroll berhasil diperbarui.
 *       '400':
 *         description: Payload tidak valid atau kosong.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Definisi komponen payroll tidak ditemukan.
 *       '409':
 *         description: Kombinasi tipe, nama, dan arah komponen sudah digunakan oleh data lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus definisi komponen payroll
 *     description: Melakukan soft delete secara default, atau hard delete jika query param `hard=1` atau `force=1` dikirim.
 *     tags: [Admin - Definisi Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID definisi komponen payroll.
 *       - in: query
 *         name: hard
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Set 1 untuk menghapus permanen.
 *       - in: query
 *         name: force
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Alias untuk hard delete.
 *     responses:
 *       '200':
 *         description: Definisi komponen payroll berhasil dihapus.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Definisi komponen payroll tidak ditemukan.
 *       '409':
 *         description: Data tidak dapat dihapus karena masih dipakai item payroll.
 *       '500':
 *         description: Terjadi kesalahan server.
 */

const adminDefinisiKomponenPayrollIdDocs = {};

export default adminDefinisiKomponenPayrollIdDocs;
