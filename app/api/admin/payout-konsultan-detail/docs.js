/**
 * @swagger
 * tags:
 *   - name: Admin - Payout Konsultan Detail
 *     description: Manajemen detail transaksi payout konsultan dari panel admin.
 * /api/admin/payout-konsultan-detail:
 *   get:
 *     summary: Daftar payout konsultan detail
 *     description: Mengambil daftar detail payout konsultan dengan filter, pencarian, sorting, dan pagination.
 *     tags: [Admin - Payout Konsultan Detail]
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
 *         description: Cari berdasarkan catatan detail, catatan payout, nama user payout, email user, nama klien, deskripsi transaksi, atau nama produk.
 *       - in: query
 *         name: id_payout_konsultan
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_transaksi_konsultan
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_periode_konsultan
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_user
 *         schema:
 *           type: string
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
 *           enum: [created_at, updated_at, nominal_share, nominal_oss]
 *           default: created_at
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       '200':
 *         description: Daftar payout konsultan detail berhasil diambil.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   post:
 *     summary: Buat payout konsultan detail
 *     description: |
 *       Membuat detail payout konsultan baru. Rule bisnis:
 *       - payout induk wajib aktif, tidak soft delete, periode payout tidak terkunci, dan belum `DIPOSTING_KE_PAYROLL`.
 *       - transaksi wajib berasal dari user dan periode konsultan yang sama dengan payout induk.
 *       - transaksi tidak boleh sudah diposting ke payroll.
 *       - transaksi tidak boleh sudah terhubung ke payout aktif lain.
 *       - jika kombinasi payout + transaksi pernah soft delete, record lama akan dipulihkan lalu diperbarui.
 *       - setelah create/restore, `total_share` dan `nominal_ditahan` pada payout induk dihitung ulang otomatis.
 *       - `nominal_dibayarkan` payout induk akan mengikuti `nominal_penyesuaian` yang tersimpan.
 *     tags: [Admin - Payout Konsultan Detail]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_payout_konsultan
 *               - id_transaksi_konsultan
 *             properties:
 *               id_payout_konsultan:
 *                 type: string
 *               id_transaksi_konsultan:
 *                 type: string
 *               nominal_share:
 *                 type: number
 *                 format: decimal
 *                 description: Opsional. Default mengambil snapshot `nominal_share` dari transaksi.
 *               nominal_oss:
 *                 type: number
 *                 format: decimal
 *                 description: Opsional. Default mengambil snapshot `nominal_oss` dari transaksi.
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '201':
 *         description: Payout konsultan detail berhasil dibuat.
 *       '200':
 *         description: Record soft delete dipulihkan dan diperbarui.
 *       '400':
 *         description: Payload tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '409':
 *         description: Konflik relasi bisnis payout atau transaksi.
 *       '500':
 *         description: Terjadi kesalahan server.
 */
export const payoutKonsultanDetailDocs = true;
