'use strict';

let DataTypes = CT.Sequelize.DataTypes;

module.exports = CT.db.define('user', {
        id: {
            type: DataTypes.BIGINT(20),
            field: 'id',
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING(64),
            field: 'username',
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING(128),
            field: 'password',
        },
        lastLoginTime: {
            type: DataTypes.INTEGER(11),
            field: 'last_login_time',
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
        tableName: `${CT.constant.TABLE_PREFIX}user`,
        comment: '账户',
        indexes: [
            {
                // name: '',
                // type: '',//UNIQUE, FULLTEXT and SPATIAL
                method: 'btree',//BTREE and HASH
                unique: false,
                fields: ['username', 'password'],
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