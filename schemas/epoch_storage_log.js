'use strict';

let DataTypes = CT.Sequelize.DataTypes;

module.exports = CT.db.define('epochStorageLog', {
        id: {
            type: DataTypes.BIGINT(53),
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        free: {
            type: DataTypes.BIGINT(53),
            field: 'free',
            allowNull: false,
        },
        reportedFilesSize: {
            type: DataTypes.BIGINT(53),
            field: 'reported_files_size',
            allowNull: false,
        },
        filesCount: {
            type: DataTypes.BIGINT(53),
            field: 'files_count',
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.INTEGER(11),
            field: 'created_at',
        },
        updatedAt: {
            type: DataTypes.INTEGER(11),
            field: 'updated_at'
        },
    },
    {
        createdAt: false,
        updatedAt: false,
        tableName: `${CT.constant.TABLE_PREFIX}epoch_storage_log`,
        comment: 'epochStorageLog',
        indexes: [
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['created_at'],
            },
        ],
    });