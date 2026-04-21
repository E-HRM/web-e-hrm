/**
 * @swagger
 * tags:
 *   - name: Admin - Cicilan Pinjaman Karyawan
 *     description: Manajemen data cicilan pinjaman karyawan dari panel admin.
 * /api/admin/cicilan-pinjaman-karyawan:
 *   get:
 *     summary: Daftar cicilan pinjaman karyawan
 *     description: Mengambil daftar cicilan pinjaman karyawan dengan filter, pencarian, sorting, dan pagination.
 *     tags: [Admin - Cicilan Pinjaman Karyawan]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan catatan, nama pinjaman, nama user, email, atau NIK.
 *       - in: query
 *         name: id_pinjaman_karyawan
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_payroll_karyawan
 *         schema:
 *           type: string
 *       - in: query
 *         name: status_cicilan
 *         schema:
 *           type: string
 *           enum: [MENUNGGU, DIPOSTING, DIBAYAR, DILEWATI]
 *       - in: query
 *         name: jatuhTempoFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: jatuhTempoTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dipostingFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dipostingTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dibayarFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: dibayarTo
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *       - in: query
 *         name: deletedOnly
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, jatuh_tempo, nominal_tagihan, nominal_terbayar, status_cicilan, diposting_pada, dibayar_pada]
 *           default: jatuh_tempo
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       '200':
 *         description: Daftar cicilan pinjaman karyawan berhasil diambil.
 *       '400':
 *         description: Filter tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   post:
 *     summary: Buat cicilan pinjaman karyawan
 *     description: |
 *       Membuat cicilan pinjaman karyawan baru. Logic bisnis yang diterapkan:
 *       - `jatuh_tempo` wajib berada di dalam periode pinjaman.
 *       - hanya boleh ada satu cicilan aktif untuk kombinasi pinjaman + jatuh tempo.
 *       - total `nominal_tagihan` cicilan aktif tidak boleh melebihi `nominal_pinjaman`.
 *       - akumulasi `nominal_terbayar` semua cicilan tidak boleh melebihi `nominal_pinjaman`.
 *       - status `MENUNGGU` dan `DILEWATI` tidak boleh memiliki payroll maupun timestamp posting/pembayaran.
 *       - status `DIPOSTING` wajib memiliki `id_payroll_karyawan` dan `diposting_pada`.
 *       - status `DIBAYAR` wajib `nominal_terbayar = nominal_tagihan`, `dibayar_pada` terisi, dan jika terhubung ke payroll maka payroll harus berstatus `DIBAYAR`.
 *       - setelah create, `sisa_saldo` dan `status_pinjaman` pada pinjaman induk akan dihitung ulang otomatis.
 *     tags: [Admin - Cicilan Pinjaman Karyawan]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_pinjaman_karyawan, jatuh_tempo]
 *             properties:
 *               id_pinjaman_karyawan:
 *                 type: string
 *               id_payroll_karyawan:
 *                 type: string
 *                 nullable: true
 *               jatuh_tempo:
 *                 type: string
 *                 format: date
 *               nominal_tagihan:
 *                 type: string
 *                 example: '1000000.00'
 *                 description: Jika tidak dikirim, akan memakai `nominal_cicilan` dari pinjaman induk.
 *               nominal_terbayar:
 *                 type: string
 *                 example: '0.00'
 *               status_cicilan:
 *                 type: string
 *                 enum: [MENUNGGU, DIPOSTING, DIBAYAR, DILEWATI]
 *               diposting_pada:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               dibayar_pada:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '201':
 *         description: Cicilan pinjaman karyawan berhasil dibuat.
 *       '400':
 *         description: Payload tidak valid atau melanggar logic bisnis.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '500':
 *         description: Terjadi kesalahan server.
 */
