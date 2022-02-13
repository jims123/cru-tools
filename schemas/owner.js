'use strict';

let DataTypes = CT.Sequelize.DataTypes;

module.exports = CT.db.define('owner', {
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
        email: {
            type: DataTypes.STRING(128),
            field: 'email',
            allowNull: true,
        },
        address: {
            type: DataTypes.STRING(64),
            field: 'address',
            allowNull: false,
        },
        controllerAddress: {
            type: DataTypes.STRING(64),
            field: 'controller_address',
            allowNull: true,
        },
        source: {
            type: DataTypes.STRING(64),
            field: 'source',
            allowNull: true,
        },
        reportSize:{
            type: DataTypes.BIGINT(50),
            field: 'report_size',
            allowNull: true,
        },
        needClaims: {
            type: DataTypes.INTEGER(11),
            field: 'need_claims',
            allowNull: false,
            defaultValue: 0,
        },
        sendEmergency: {
            type: DataTypes.INTEGER(11),
            field: 'send_mergency',
            allowNull: false,
            defaultValue: 0,
        },
        deleted: {
            type: DataTypes.INTEGER(11),
            field: 'deleted',
            allowNull: false,
            defaultValue: 0,
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
        tableName: `${CT.constant.TABLE_PREFIX}owner`,
        comment: 'owner',
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
                unique: false,
                fields: ['address'],
            },
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'BTREE',//BTREE and HASH
                unique: false,
                fields: ['source'],
            },
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'BTREE',//BTREE and HASH
                unique: false,
                fields: ['deleted'],
            },
        ],
    });