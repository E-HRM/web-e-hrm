/**
 * @swagger
 * /api/admin/periode-payroll/{id}:
 *   get:
 *     summary: Detail periode payroll
 *     description: Mengambil detail satu periode payroll berdasarkan ID.
 *     tags: [Admin - Periode Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID periode payroll.
 *     responses:
 *       '200':
 *         description: Detail periode payroll ditemukan.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/PeriodePayroll'
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   put:
 *     summary: Perbarui periode payroll
 *     description: Memperbarui periode payroll berdasarkan ID. Jika `tahun` dan `bulan` diubah, kombinasi tersebut tidak boleh bentrok dengan data lain. Endpoint ini juga memvalidasi hubungan status dengan `diproses_pada` dan `difinalkan_pada`.
 *     tags: [Admin - Periode Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID periode payroll.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tahun:
 *                 type: integer
 *                 minimum: 2000
 *                 maximum: 9999
 *               bulan:
 *                 type: string
 *                 enum: [JANUARI, FEBRUARI, MARET, APRIL, MEI, JUNI, JULI, AGUSTUS, SEPTEMBER, OKTOBER, NOVEMBER, DESEMBER]
 *               tanggal_mulai:
 *                 type: string
 *                 format: date
 *               tanggal_selesai:
 *                 type: string
 *                 format: date
 *               status_periode:
 *                 type: string
 *                 enum: [DRAFT, DIPROSES, DIREVIEW, FINAL, TERKUNCI]
 *               diproses_pada:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               difinalkan_pada:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Periode payroll berhasil diperbarui.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PeriodePayroll'
 *       '400':
 *         description: Payload tidak valid atau kosong.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Kombinasi tahun dan bulan sudah digunakan oleh data lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   delete:
 *     summary: Hapus periode payroll
 *     description: Secara default melakukan soft delete pada periode payroll dan juga soft delete untuk `payroll_karyawan` serta `persetujuan_periode` yang terkait. Tambahkan query `hard=true` atau `force=true` untuk hard delete permanen.
 *     tags: [Admin - Periode Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID periode payroll.
 *       - in: query
 *         name: hard
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['1', 'true']
 *         description: Isi `true` atau `1` untuk hard delete permanen.
 *       - in: query
 *         name: force
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['1', 'true']
 *         description: Alias dari hard delete permanen.
 *     responses:
 *       '200':
 *         description: Data berhasil dihapus.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 mode:
 *                   type: string
 *                   enum: [soft, hard]
 *                 data:
 *                   $ref: '#/components/schemas/PeriodePayroll'
 *                 cascade_summary:
 *                   type: object
 *                   properties:
 *                     payroll_karyawan_soft_deleted:
 *                       type: integer
 *                     persetujuan_periode_soft_deleted:
 *                       type: integer
 *                     payout_konsultan_tetap_terhubung:
 *                       type: integer
 *                 relation_summary:
 *                   type: object
 *                   properties:
 *                     payroll_karyawan_terhapus_mengikuti_cascade:
 *                       type: integer
 *                     persetujuan_periode_terhapus_mengikuti_cascade:
 *                       type: integer
 *                     payout_konsultan_yang_id_periode_payroll_menjadi_null:
 *                       type: integer
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '404':
 *         description: Data tidak ditemukan.
 *       '409':
 *         description: Data sudah di-soft delete atau hard delete gagal karena constraint lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 */

const adminPeriodePayrollIdDocs = {};

export default adminPeriodePayrollIdDocs;
