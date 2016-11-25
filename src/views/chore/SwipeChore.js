/**
 * Created by Layman <anysome@gmail.com> (http://github.com/anysome) on 16/11/24.
 */
import React from 'react';
import {RefreshControl, View, Text} from 'react-native';

import SwipeableListViewDataSource from 'SwipeableListViewDataSource';
import SwipeableListView from 'SwipeableListView';
import SwipeableQuickActions from 'SwipeableQuickActions';
import SwipeableQuickActionButton from 'SwipeableQuickActionButton';
import TouchableBounce from 'TouchableBounce';

import {analytics, airloy, styles, colors, api, toast, L, hang} from '../../app';
import util from '../../libs/Util';
import ListSource from '../../logic/ListSource';
import EventTypes from '../../logic/EventTypes';

import Controller from '../Controller';
import ListSectionView from '../../widgets/ListSectionView';
import ActionSheet from '@yfuks/react-native-action-sheet';

import Edit from './Edit';
import Listing from './SwipeListing';

export default class SwipeChore extends Controller {

  constructor(props) {
    super(props);
    this.name = 'Chore';
    this.listSource = null;
    this.state = {
      isRefreshing: true,
      dataSource: new SwipeableListViewDataSource({
        getSectionHeaderData: (dataBlob, sectionId) => dataBlob[sectionId],
        getRowData: (dataBlob, sectionId, rowId) => dataBlob[sectionId].getRow(rowId),
        rowHasChanged: (row1, row2) => row1 !== row2,
        sectionHeaderHasChanged: (s1, s2) => s1 !== s2
      })
    };
  }

  componentWillMount() {
    if (this.route) {// Logout and then login cause currentRoute to be null. Maybe a bug.
      this.route.rightButtonIcon = require('../../../resources/icons/more.png');
      this.route.onRightButtonPress = () => {
        let BUTTONS = ['新备忘', '清空回收站', '取消'];
        ActionSheet.showActionSheetWithOptions({
            options: BUTTONS,
            cancelButtonIndex: 2,
            destructiveButtonIndex: 1,
            tintColor: colors.dark2
          },
          async (buttonIndex) => {
            switch (buttonIndex) {
              case 0 :
                this.props.navigator.push({
                  title: '添加',
                  component: Edit,
                  passProps: {
                    onUpdated: (rowData) => this.updateRow(rowData)
                  }
                });
                break;
              case 1 :
                hang();
                let result = await airloy.net.httpGet(api.chore.clean);
                if (result.success) {
                  result.info && this.reload();
                } else {
                  toast(L(result.message));
                }
                hang(false);
                break;
            }
          }
        );
      };
      this.route.leftButtonIcon = require('../../../resources/icons/folder.png');
      this.route.onLeftButtonPress = () => {
        this.forward({
          title: '分类清单',
          component: Listing,
          rightButtonIcon: require('../../../resources/icons/create.png'),
          passProps: {
            today: this.today
          }
        });
      };
      util.isAndroid() || this.props.navigator.replace(this.route);
    }
    airloy.event.on(EventTypes.choreChange, ()=> {
      // call network request or mark stale until page visible
      this.visible ? this.reload() : this.markStale();
    });
    airloy.event.on(EventTypes.choreAdd, (chore)=> {
      this.listSource.add(chore);
      this._sortList();
    });
  }

  async _reload() {
    this.setState({
      isRefreshing: true
    });
    let result = await airloy.net.httpGet(api.chore.list);
    if (result.success) {
      this.listSource = new ListSource(result.info);
      this._sortList();
      this.setState({
        isRefreshing: false
      });
    } else {
      result.message !== 'error.request.auth' && this.setState({
        isRefreshing: false
      });
      toast(L(result.message));
    }
  }

  _sortList() {
    let section0 = new ListSectionView.DataSource({id: 0, name: '收集箱'});
    let section1 = new ListSectionView.DataSource({id: 1, name: '回收站'});
    for (let rowData of this.listSource) {
      this._sortRow(rowData, section0, section1);
    }
    this.setState({
      dataSource: this.state.dataSource.cloneWithRowsAndSections(
        [section0, section1],
        [0, 1],
        [section0.rowIds, section1.rowIds]
      )
    });
  }

  _sortRow(rowData, section0, section1) {
    var section;
    if (rowData.arranged) return;
    if (rowData.catalog === 'recycled') {
      section = section1;
    } else {
      section = section0;
    }
    section.push(rowData);
  }

  _pressRow(rowData, sectionId) {
    this.props.navigator.push({
      title: '修改',
      component: Edit,
      rightButtonIcon: require('../../../resources/icons/more.png'),
      passProps: {
        data: rowData,
        onUpdated: (rowData) => this.updateRow(rowData),
        onDeleted: (rowData) => this.deleteRow(rowData)
      }
    });
  }

  _toArrange(rowData) {
    let BUTTONS = ['安排到今天', '安排到明天', '安排到后天', '取消'];
    let CANCEL_INDEX = 3;
    ActionSheet.showActionSheetWithOptions({
        options: BUTTONS,
        cancelButtonIndex: CANCEL_INDEX,
        tintColor: colors.dark2
      },
      async (buttonIndex) => {
        if (buttonIndex !== CANCEL_INDEX) {
          hang();
          let newDate = new Date(this.today + 86400000 * buttonIndex);
          let result = await airloy.net.httpGet(api.chore.arrange, {
              id: rowData.id,
              date: newDate
            }
          );
          hang(false);
          if (result.success) {
            airloy.event.emit(EventTypes.agendaAdd, result.info);
            this.listSource.remove(rowData);
            this._sortList();
          } else {
            toast(L(result.message));
          }
        }
      }
    );
  }

  updateRow(rowData) {
    // also for add
    this.listSource.update(rowData);
    this.props.navigator.pop();
    this._sortList();
  }

  deleteRow(rowData) {
    this.listSource.remove(rowData);
    this.props.navigator.pop();
    this._sortList();
  }

  _renderRow(rowData, sectionId, rowId) {
    return (
      <TouchableBounce style={styles.listRow}
                        onPress={() => this._pressRow(rowData, sectionId)} >
        <View style={styles.flex}>
          <Text style={styles.title}>{rowData.title}</Text>
          {rowData.detail ? <Text style={styles.text}>{rowData.detail}</Text> : null}
        </View>
      </TouchableBounce>
    );
  }

  _renderSectionHeader(sectionData, sectionId) {
    return <ListSectionView data={sectionData}/>;
  }

  _renderSeparator(sectionId, rowId, adjacentRowHighlighted) {
    return <View key={rowId + '_separator'} style={styles.hr}></View>
  }

  _renderActions(rowData, sectionId) {
    return (
      <SwipeableQuickActions style={styles.rowActions}>
        { sectionId !== 2 &&
        <SwipeableQuickActionButton imageSource={{}} text={"安排"}
                                    onPress={() => this._toArrange(rowData, sectionId)}
                                    style={styles.rowAction} textStyle={styles.rowText}/>
        }
        <SwipeableQuickActionButton imageSource={{}} text={"删除"}
                                    onPress={() => this._delete(rowData)}
                                    style={styles.rowActionDestructive} textStyle={styles.rowText}/>
      </SwipeableQuickActions>
    );
  }

  async _delete(rowData) {
    let isTrash = rowData.catalog === 'recycled';
    hang();
    let result2 = await airloy.net.httpGet(api.chore.remove, {id: rowData.id});
    hang(false);
    if (result2.success) {
      if (isTrash) {
        this.listSource.remove(rowData);
        this._sortList();
      } else {
        rowData.catalog = 'recycled';
        this.listSource.update(rowData);
        this._sortList();
      }
    }
  }

  render() {
    return (
      <SwipeableListView
        maxSwipeDistance={120}
        renderQuickActions={(rowData, sectionId, rowId) => this._renderActions(rowData, sectionId)}
        enableEmptySections={true}
        initialListSize={10}
        pageSize={5}
        dataSource={this.state.dataSource}
        renderRow={(rowData, sectionId, rowId) => this._renderRow(rowData, sectionId, rowId)}
        renderSectionHeader={this._renderSectionHeader}
        renderSeparator={this._renderSeparator}
        refreshControl={
                          <RefreshControl
                            refreshing={this.state.isRefreshing}
                            onRefresh={() => this.reload()}
                            tintColor={colors.accent}
                            title={'加载中...'}
                            colors={[colors.accent, colors.action]}
                            progressBackgroundColor={colors.bright1}
                          />}
      />
    );
  }
}