/**
 * @swagger
 * tags:
 *   - name: Admin - Item Komponen Payroll
 *     description: Manajemen item komponen payroll per payroll karyawan dari panel admin.
 * /api/admin/item-komponen-payroll/{id}:
 *   get:
 *     summary: Detail item komponen payroll
 *     tags: [Admin - Item Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Detail item komponen payroll berhasil diambil.
 *       '404':
 *         description: Item komponen payroll tidak ditemukan.
 *   put:
 *     summary: Update item komponen payroll
 *     description: |
 *       Memperbarui item komponen payroll berdasarkan schema saat ini.
 *       - field non-schema lama seperti `modul_sumber`, `id_data_sumber`, `sumber_input`, `kode_proses_massal`, `nama_proses_massal`, `diproses_pada`, dan `is_locked` tidak lagi diterima.
 *       - jika `id_definisi_komponen_payroll` dikirim, snapshot komponen akan diambil ulang dari definisi tersebut.
 *       - jika item dipindahkan ke payroll lain, payroll asal dan payroll tujuan harus sama-sama mutable agar total keduanya dapat dihitung ulang.
 *       - gunakan query `restore=true` untuk memulihkan soft-deleted item sambil mengubah datanya.
 *     tags: [Admin - Item Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: restore
 *         schema:
 *           type: boolean
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_payroll_karyawan:
 *                 type: string
 *               id_definisi_komponen_payroll:
 *                 type: string
 *                 nullable: true
 *               id_user_pembuat:
 *                 type: string
 *                 nullable: true
 *               kunci_idempoten:
 *                 type: string
 *               tipe_komponen:
 *                 type: string
 *               arah_komponen:
 *                 type: string
 *                 enum: [PEMASUKAN, POTONGAN]
 *               nama_komponen:
 *                 type: string
 *               nominal:
 *                 type: number
 *               urutan_tampil:
 *                 type: integer
 *                 minimum: 0
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Item komponen payroll berhasil diperbarui.
 *       '400':
 *         description: Payload tidak valid.
 *       '404':
 *         description: Item komponen payroll tidak ditemukan.
 *       '409':
 *         description: Konflik bisnis seperti soft-deleted belum direstore atau kunci idempoten duplikat.
 *   delete:
 *     summary: Hapus item komponen payroll
 *     description: |
 *       Menghapus item komponen payroll.
 *       - default: soft delete
 *       - `hard=true`: hapus permanen
 *       - soft delete dan hard delete atas item aktif hanya boleh jika payroll masih mutable.
 *     tags: [Admin - Item Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hard
 *         schema:
 *           type: boolean
 *     responses:
 *       '200':
 *         description: Item komponen payroll berhasil dihapus.
 *       '404':
 *         description: Item komponen payroll tidak ditemukan.
 *       '409':
 *         description: Item sudah dihapus sebelumnya atau payroll tidak mutable.
 */
export {};
