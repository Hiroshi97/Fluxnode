import React from 'react';

import './index.scss';

import { FiZap, FiCpu, FiPackage } from 'react-icons/fi';
import { IconContext } from 'react-icons';

import * as utils from 'utils';
import { pad_start } from 'utils';

const split_minutes = (asMinutes) => utils.split_duration(utils.ds.duration({ minutes: asMinutes }));

const tierMapping = {
  CUMULUS: {
    styleSet: 'cumulus',
    name: 'Cumulus',
    logo: FiZap
  },
  NIMBUS: {
    styleSet: 'nimbus',
    name: 'Nimbus',
    logo: FiCpu
  },
  STRATUS: {
    styleSet: 'stratus',
    name: 'Stratus',
    logo: FiPackage
  }
};

export class PayoutTimer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      restTime: { days: 0, hours: 0, minutes: 0 },
      seconds: 0,
      hidden: true,

      nodeIpDef: {},
      nodeIp: '',
      nodeTier: ''
    };

    this.intervalID = null;
    this.currentIntervalRevision = 0;
    this.mounted = false;
  }

  componentDidMount() {
    if (this.mounted) return;

    this.mounted = true;
    // console.log("Mounted Timer");
  }

  restRemaining() {
    const { days, hours, minutes } = this.state.restTime;
    return utils.ds.duration({ days, hours, minutes }).asMinutes();
  }

  pauseAndHide() {
    if (this.intervalID != null) {
      clearInterval(this.intervalID);
      this.intervalID = null;
      this.currentIntervalRevision++;
    }

    if (!this.state.hidden) this.setState({ hidden: true });
  }

  resumeAndShow() {
    if (this.intervalID != null) {
      clearInterval(this.intervalID);
    }
    if (this.restRemaining() + this.state.seconds != 0)
      this.intervalID = setInterval(this.countDown.bind(this, ++this.currentIntervalRevision), 1000);

    if (this.state.hidden) this.setState({ hidden: false });
  }

  receiveNode(node) {
    clearInterval(this.intervalID);
    this.intervalID = null;

    let _this = this;
    const { days, hours, minutes } = split_minutes(node.rank * 2);
    this.setState(
      {
        restTime: { days, hours, minutes },
        seconds: 0,
        hidden: false,
        nodeIpDef: node.ip_full,
        nodeIp: node.ip_display,
        nodeTier: node.tier
      },
      () => {
        _this.resumeAndShow();
      }
    );
  }

  countDown = (callRevision) => {
    if (callRevision != this.currentIntervalRevision)
      // It is a 'leaked' call from a cancelled setInterval
      return;

    if (this.state.seconds > 0) {
      let newSeconds = this.state.seconds - 1;
      this.setState({ seconds: newSeconds });
      return;
    }

    let remainingMinutes = this.restRemaining();
    if (remainingMinutes > 0) {
      const { days, hours, minutes } = split_minutes(remainingMinutes - 1);
      this.setState({
        restTime: { days, hours, minutes },
        seconds: 59
      });
      return;
    }

    // Timer ran out
    this.setState({
      restTime: { days: 0, hours: 0, minutes: 0 },
      seconds: 0
    });
    clearInterval(this.intervalID);
    this.intervalID = null;
  };

  render() {
    const { hidden, nodeIp, nodeIpDef } = this.state;

    const tMap = tierMapping[this.state.nodeTier] || {};
    const LogoComp = tMap.logo;

    return (
      <>
        <div className='timer'>
          <div className='timer-header'>
            <div className='title'>Next Payout</div>
            <div className={'timer-node-ip adp-text-muted' + (hidden ? ' d-none' : '')}>
              <strong>Node IP:&nbsp;</strong>
              {nodeIp ? (
                <a target='_blank' href={`http://${nodeIpDef.host}:${nodeIpDef.active_port_os}`}>
                  {nodeIp}
                </a>
              ) : (
                <i> -Unknown- </i>
              )}
            </div>
          </div>
          <div className='timer-blocks'>
            <div className={'timer-node-logo' + (hidden ? ' d-none' : '')}>
              <div className={'pyt-i-wrap dash-cell__nodes-' + tMap.styleSet}>
                <IconContext.Provider value={{ size: '19px', color: 'currentColor' }}>
                  {LogoComp && <LogoComp />}
                </IconContext.Provider>
              </div>
              <span className='pyt-node-tier'>{tMap.name}</span>
            </div>
            <div className='timer-block'>
              <span className='adp-text-normal timer-number'>{pad_start(hidden ? 0 : this.state.restTime.days)}</span>
              <span className='adp-text-normal timer-info'>Days</span>
            </div>
            <div className='v-rule'> </div>
            <div className='timer-block'>
              <span className='adp-text-normal timer-number'>{pad_start(hidden ? 0 : this.state.restTime.hours)}</span>
              <span className='adp-text-normal timer-info'>Hours</span>
            </div>
            <div className='v-rule'> </div>
            <div className='timer-block'>
              <span className='adp-text-normal timer-number'>
                {pad_start(hidden ? 0 : this.state.restTime.minutes)}
              </span>
              <span className='adp-text-normal timer-info'>Minutes</span>
            </div>
            <div className='v-rule'> </div>
            <div className='timer-block'>
              <span className='adp-text-normal timer-number'>{pad_start(hidden ? 0 : this.state.seconds)}</span>
              <span className='adp-text-normal timer-info'>Seconds</span>
            </div>
          </div>
        </div>
      </>
    );
  }
}
