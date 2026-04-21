/**
 * @swagger
 * tags:
 *   - name: Admin - Transaksi Konsultan
 *     description: Manajemen transaksi konsultan dari panel admin.
 * /api/admin/transaksi-konsultan:
 *   get:
 *     summary: Daftar transaksi konsultan
 *     description: Mengambil daftar transaksi konsultan dengan filter, pencarian, sorting, dan pagination.
 *     tags: [Admin - Transaksi Konsultan]
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
 *         description: Cari berdasarkan nama klien, deskripsi, catatan, nama konsultan, atau nama produk.
 *       - in: query
 *         name: id_periode_konsultan
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_user_konsultan
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_jenis_produk_konsultan
 *         schema:
 *           type: string
 *       - in: query
 *         name: tanggalFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: tanggalTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: override_manual
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *       - in: query
 *         name: sudah_posting_payroll
 *         schema:
 *           type: integer
 *           enum: [0, 1]
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
 *           enum: [created_at, updated_at, tanggal_transaksi, nama_klien, nominal_debit, nominal_kredit, total_income, nominal_share, nominal_oss, override_manual, sudah_posting_payroll]
 *           default: tanggal_transaksi
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       '200':
 *         description: Daftar transaksi konsultan berhasil diambil.
 *       '400':
 *         description: Filter tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   post:
 *     summary: Buat transaksi konsultan
 *     description: |
 *       Membuat transaksi konsultan baru. Logic bisnis yang diterapkan:
 *       - `tanggal_transaksi` wajib berada dalam rentang periode konsultan.
 *       - periode tidak boleh soft delete dan tidak boleh berstatus `TERKUNCI`.
 *       - `total_income` otomatis dihitung dari `nominal_debit - nominal_kredit`.
 *       - jika `override_manual=false`, maka `nominal_share` dan `nominal_oss` dihitung otomatis dari persen share efektif.
 *       - jika `override_manual=true`, maka `nominal_share` dan/atau `nominal_oss` boleh dikirim manual, tetapi totalnya tetap harus sama dengan `total_income`.
 *       - `sudah_posting_payroll` tidak bisa di-set manual saat create.
 *     tags: [Admin - Transaksi Konsultan]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_periode_konsultan, tanggal_transaksi]
 *             properties:
 *               id_periode_konsultan:
 *                 type: string
 *               id_user_konsultan:
 *                 type: string
 *                 nullable: true
 *               id_jenis_produk_konsultan:
 *                 type: string
 *                 nullable: true
 *               tanggal_transaksi:
 *                 type: string
 *                 format: date
 *               nama_klien:
 *                 type: string
 *                 nullable: true
 *               deskripsi:
 *                 type: string
 *                 nullable: true
 *               nominal_debit:
 *                 type: number
 *                 format: decimal
 *                 default: 0
 *               nominal_kredit:
 *                 type: number
 *                 format: decimal
 *                 default: 0
 *               persen_share_default:
 *                 type: number
 *                 format: decimal
 *                 nullable: true
 *               persen_share_override:
 *                 type: number
 *                 format: decimal
 *                 nullable: true
 *               override_manual:
 *                 type: boolean
 *                 default: false
 *               nominal_share:
 *                 type: number
 *                 format: decimal
 *                 description: Hanya boleh diisi saat `override_manual=true`.
 *               nominal_oss:
 *                 type: number
 *                 format: decimal
 *                 description: Hanya boleh diisi saat `override_manual=true`.
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '201':
 *         description: Transaksi konsultan berhasil dibuat.
 *       '400':
 *         description: Payload tidak valid atau melanggar logic bisnis.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '500':
 *         description: Terjadi kesalahan server.
 */
