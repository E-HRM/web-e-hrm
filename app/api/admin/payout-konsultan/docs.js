/**
 * @swagger
 * tags:
 *   - name: Admin - Payout Konsultan
 *     description: Manajemen payout konsultan dari panel admin.
 * /api/admin/payout-konsultan:
 *   get:
 *     summary: Daftar payout konsultan
 *     description: Mengambil daftar payout konsultan dengan filter, pencarian, sorting, dan pagination.
 *     tags: [Admin - Payout Konsultan]
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
 *         description: Cari berdasarkan catatan, nama karyawan, email, atau nomor induk karyawan.
 *       - in: query
 *         name: id_periode_konsultan
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_user
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_periode_payroll
 *         schema:
 *           type: string
 *       - in: query
 *         name: status_payout
 *         schema:
 *           type: string
 *           enum: [DRAFT, DISETUJUI, DIPOSTING_KE_PAYROLL, DITAHAN]
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
 *           enum: [created_at, updated_at, total_share, nominal_ditahan, nominal_penyesuaian, nominal_dibayarkan, status_payout, disetujui_pada, diposting_pada]
 *           default: created_at
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       '200':
 *         description: Daftar payout konsultan berhasil diambil.
 *       '400':
 *         description: Parameter query tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   post:
 *     summary: Buat payout konsultan
 *     description: |
 *       Membuat payout konsultan baru dengan aturan bisnis berikut:
 *       - detail payout dibangun otomatis dari seluruh transaksi konsultan aktif (`deleted_at=null`) milik user pada periode yang dipilih.
 *       - hanya transaksi yang belum diposting ke payroll (`sudah_posting_payroll=false`) yang akan dihitung.
 *       - `total_share` dan `nominal_ditahan` dihitung otomatis oleh sistem.
 *       - `nominal_penyesuaian` diisi manual sebagai nominal akhir payout.
 *       - `nominal_dibayarkan` mengikuti nilai `nominal_penyesuaian` yang disimpan.
 *       - jika kombinasi `id_periode_konsultan + id_user` sudah ada dalam kondisi soft delete, data akan dipulihkan dan disinkronkan ulang.
 *       - jika `status_payout=DIPOSTING_KE_PAYROLL`, sistem akan membuat/memperbarui item komponen payroll bertipe `INSENTIF_KONSULTAN` dan menandai transaksi sumber sebagai sudah diposting.
 *     tags: [Admin - Payout Konsultan]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_periode_konsultan, id_user]
 *             properties:
 *               id_periode_konsultan:
 *                 type: string
 *               id_user:
 *                 type: string
 *               id_periode_payroll:
 *                 type: string
 *                 nullable: true
 *               nominal_ditahan:
 *                 type: string
 *                 example: '0.00'
 *               nominal_penyesuaian:
 *                 type: string
 *                 example: '850000.00'
 *                 description: Nominal akhir payout yang diinput manual user.
 *               status_payout:
 *                 type: string
 *                 enum: [DRAFT, DISETUJUI, DIPOSTING_KE_PAYROLL, DITAHAN]
 *                 default: DRAFT
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Data payout soft delete berhasil dipulihkan.
 *       '201':
 *         description: Payout konsultan berhasil dibuat.
 *       '400':
 *         description: Payload tidak valid atau data sumber transaksi tidak memenuhi syarat.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '409':
 *         description: Kombinasi payout aktif sudah ada atau terjadi konflik bisnis.
 *       '500':
 *         description: Terjadi kesalahan server.
 */
