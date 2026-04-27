/**
 * @swagger
 * /api/admin/profil-payroll/{id}:
 *   get:
 *     summary: Detail profil payroll
 *     description: Mengambil detail satu profil payroll berdasarkan ID profil payroll.
 *     tags: [Admin - Profil Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID profil payroll.
 *     responses:
 *       '200':
 *         description: Detail profil payroll ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/ProfilPayroll'
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Profil payroll tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui profil payroll
 *     description: Memperbarui field profil payroll berdasarkan ID profil payroll.
 *     tags: [Admin - Profil Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID profil payroll.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_user:
 *                 type: string
 *                 description: ID user baru. User harus aktif dan tidak boleh memiliki profil payroll lain.
 *               jenis_hubungan_kerja:
 *                 type: string
 *                 enum: [FREELANCE, INTERNSHIP, PKWT, PKWTT]
 *               gaji_pokok:
 *                 type: number
 *               tunjangan_bpjs:
 *                 type: number
 *               payroll_aktif:
 *                 type: boolean
 *               tanggal_mulai_payroll:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               catatan:
 *                 type: string
 *                 nullable: true
 *               deleted_at:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Opsional untuk mengatur ulang nilai soft delete secara manual.
 *     responses:
 *       '200':
 *         description: Profil payroll berhasil diperbarui.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ProfilPayroll'
 *       '400':
 *         description: Payload tidak valid atau kosong.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Profil payroll atau user tidak ditemukan.
 *       '409':
 *         description: User sudah memiliki profil payroll lain atau riwayat soft delete yang bentrok.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus profil payroll
 *     description: Melakukan soft delete secara default, atau hard delete jika query param `hard=1` dikirim.
 *     tags: [Admin - Profil Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID profil payroll.
 *       - in: query
 *         name: hard
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Set 1 untuk menghapus permanen (hard delete).
 *     responses:
 *       '200':
 *         description: Profil payroll berhasil dihapus.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Profil payroll tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 */

const adminProfilPayrollIdDocs = {};

export default adminProfilPayrollIdDocs;
