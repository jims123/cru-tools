'use strict';

let DataTypes = CT.Sequelize.DataTypes;

module.exports = CT.db.define('member', {
        id: {
            type: DataTypes.BIGINT(20),
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(64),
            field: 'name',
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING(64),
            field: 'address',
            allowNull: false,
        },
        source: {
            type: DataTypes.STRING(64),
            field: 'source',
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
        tableName: `${CT.constant.TABLE_PREFIX}member`,
        comment: 'member',
        indexes: [
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['name'],
            },
            {
                // name: '',
                type: 'UNIQUE',//, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: true,
                fields: ['address'],
            },
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'BTREE',//BTREE and HASH
                unique: false,
                fields: ['source'],
            },
        ],
    });